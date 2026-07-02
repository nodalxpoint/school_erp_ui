import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ Added ActivatedRoute
import { FeeService } from '../../services/fee.service';
import { StudentFeeResponseDto, FeeFilterRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeListComponent implements OnInit {
  fees: StudentFeeResponseDto[] = [];
  loading = false;

  filters: FeeFilterRequest = {
    page: 0, size: 10, sortBy: 'feeYear', sortDirection: 'DESC',
    academicSessionId: '', classId: '', sectionId: '', paymentStatus: '', dueDateFrom: ''
  };

  sessions: DropdownOption[] = [];
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];

  constructor(
    private feeService: FeeService, 
    private router: Router, 
    private route: ActivatedRoute, // ✅ Injected ActivatedRoute
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
    this.onSearch();
  }

  loadDropdowns(): void {
    this.feeService.getParams('academic_sessions').subscribe(data => { this.sessions = data; this.cdr.markForCheck(); });
    this.feeService.getParams('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
  }

  onClassChange(): void {
    this.filters.sectionId = ''; 
    this.sections = [];
    if (this.filters.classId) {
      this.feeService.getParams('sections', this.filters.classId).subscribe(data => { 
        this.sections = data; 
        this.cdr.markForCheck(); 
      });
    }
  }

  onSearch(): void {
    this.loading = true;
    const cleanPayload: any = {
      page: this.filters.page, size: this.filters.size, sortBy: this.filters.sortBy, sortDirection: this.filters.sortDirection
    };

    if (this.filters.academicSessionId) cleanPayload.academicSessionId = this.filters.academicSessionId;
    if (this.filters.classId) cleanPayload.classId = this.filters.classId;
    if (this.filters.sectionId) cleanPayload.sectionId = this.filters.sectionId;
    if (this.filters.paymentStatus) cleanPayload.paymentStatus = this.filters.paymentStatus;
    if (this.filters.dueDateFrom) cleanPayload.dueDateFrom = this.filters.dueDateFrom;

    this.feeService.filterFees(cleanPayload).subscribe({
      next: (res: any) => {
        this.fees = res.data?.data ?? []; 
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  clearAllFilters(): void {
    this.filters = {
      page: 0, size: 10, sortBy: 'feeYear', sortDirection: 'DESC',
      academicSessionId: '', classId: '', sectionId: '', paymentStatus: '', dueDateFrom: ''
    };
    this.sections = []; 
    this.onSearch();
  }

  // ── FIXED: Proper relative link matrix redirection ──
  openFeeForm(rowToModify?: StudentFeeResponseDto): void {
    if (rowToModify) {
      // Relative link calculation targeting: fee/edit/:id safely
      this.router.navigate(['../edit', rowToModify.id], { 
        relativeTo: this.route,
        state: { data: rowToModify } 
      });
    } else {
      // Relative link calculation targeting: fee/add safely
      this.router.navigate(['../add'], { relativeTo: this.route });
    }
  }
}