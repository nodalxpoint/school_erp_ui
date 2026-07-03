import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeeService } from '../../services/fee.service';
import { SaveFeeRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

@Component({
  selector: 'app-fee-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-form.component.html',
  styleUrls: ['./fee-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeeFormComponent implements OnInit {
  sessions: DropdownOption[] = [];
  isEditMode = false;
  isLoading = false;

  // Auto-suggest student management
  studentSearchToken = '';
  dynamicStudentsList: any[] = [];
  showSuggestions = false;
  selectedStudentObj: any | null = null;

  formData: SaveFeeRequest = {
    studentId: '',
    academicSessionId: '',
    feeMonth: new Date().getMonth() + 1,
    feeYear: new Date().getFullYear()
  };

  constructor(
    private feeService: FeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      this.cdr.markForCheck();
    });

    const editId = this.route.snapshot.paramMap.get('id');
    const stateData = history.state?.data;

    if (editId || stateData) {
      this.isEditMode = true;
      if (stateData) {
        this.mapIncomingEditForm(stateData);
      } else if (editId) {
        this.formData.id = editId;
      }
    }
  }

  mapIncomingEditForm(data: any): void {
    this.formData = {
      id: data.id,
      studentId: data.studentId,
      academicSessionId: data.academicSessionId,
      feeMonth: data.feeMonth,
      feeYear: data.feeYear
    };

    this.selectedStudentObj = {
      firstName: data.studentName || 'Student',
      lastName: '',
      id: data.studentId
    };
    this.studentSearchToken = data.studentName || '';
  }

  // ── Student search ──
  onStudentSearchInput(): void {
    if (this.studentSearchToken.trim().length < 2) {
      this.dynamicStudentsList = [];
      this.showSuggestions = false;
      return;
    }
    this.triggerSearchQuery();
  }

  triggerSearchQuery(): void {
    this.feeService.getStudentsList(this.studentSearchToken).subscribe(res => {
      this.dynamicStudentsList = res;
      this.showSuggestions = true;
      this.cdr.markForCheck();
    });
  }

  selectActiveStudent(student: any): void {
    this.selectedStudentObj = student;
    this.formData.studentId = student.id;
    this.studentSearchToken = `${student.firstName} ${student.lastName}`;
    this.showSuggestions = false;
    this.dynamicStudentsList = [];
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }

  onSaveSubmit(): void {
    if (!this.formData.studentId || !this.formData.academicSessionId) {
      alert('Please select a student and an academic session.');
      return;
    }
    if (!this.formData.feeMonth || !this.formData.feeYear) {
      alert('Fee month and year are required.');
      return;
    }

    // Build clean payload — only send non-empty optional fields
    const payload: SaveFeeRequest = {
      studentId: this.formData.studentId,
      academicSessionId: this.formData.academicSessionId,
      feeMonth: this.formData.feeMonth,
      feeYear: this.formData.feeYear
    };

    if (this.formData.id) payload.id = this.formData.id;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.feeService.saveFee(payload).subscribe({
      next: () => {
        this.router.navigate(['../list'], { relativeTo: this.route });
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        const msg = err?.error?.message || 'Failed to save fee record. Please try again.';
        alert(msg);
      }
    });
  }
}