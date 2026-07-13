import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeeService } from '../../services/fee.service';
import { FeeStructureDto, FeeStructureFilterRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

@Component({
  selector: 'app-fee-structure-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-structure-list.component.html',
  styleUrls: ['./fee-structure-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeeStructureListComponent implements OnInit {
  structures: FeeStructureDto[] = [];
  loading = false;
  classes: DropdownOption[] = [];
  sessions: DropdownOption[] = [];

  filters: FeeStructureFilterRequest = {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
    classId: '',
    feeName: '',
    frequency: '',
    academicSessionId: ''
  };

  constructor(
    private feeService: FeeService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.feeService.getParams('classes').subscribe(data => {
      this.classes = data;
      this.cdr.markForCheck();
    });
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      if (this.sessions.length > 0) {
        this.filters.academicSessionId = this.sessions[0].id;
      }
      this.onSearch();
      this.cdr.markForCheck();
    });
  }

  onSearch(): void {
    this.loading = true;
    const payload: any = {
      page: this.filters.page,
      size: this.filters.size,
      sortBy: this.filters.sortBy,
      sortDirection: this.filters.sortDirection
    };
    if (this.filters.classId) payload.classId = this.filters.classId;
    if (this.filters.feeName) payload.feeName = this.filters.feeName;
    if (this.filters.frequency) payload.frequency = this.filters.frequency;
    if (this.filters.academicSessionId) payload.academicSessionId = this.filters.academicSessionId;

    this.feeService.filterFeeStructures(payload).subscribe({
      next: (res: any) => {
        this.structures = res.data?.data ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  clearFilters(): void {
    this.filters = {
      page: 0,
      size: 20,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      classId: '',
      feeName: '',
      frequency: '',
      academicSessionId: this.sessions.length > 0 ? this.sessions[0].id : ''
    };
    this.onSearch();
  }

  openForm(row?: FeeStructureDto): void {
    if (row) {
      this.router.navigate(['../edit', row.id], { relativeTo: this.route, state: { data: row } });
    } else {
      this.router.navigate(['../add'], { relativeTo: this.route });
    }
  }

  frequencyLabel(freq: string): string {
    const map: Record<string, string> = {
      MONTHLY: 'Monthly', QUARTERLY: 'Quarterly',
      ANNUALLY: 'Annually', ONE_TIME: 'One Time'
    };
    return map[freq] || freq;
  }
}