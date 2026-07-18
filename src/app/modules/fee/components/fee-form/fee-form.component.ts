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

  // ✅ naya — toast popup ke liye
  showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

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
      id: data.studentId,
      className: data.className || '',
      sectionName: data.sectionName || ''
    };
    this.studentSearchToken = data.studentName || '';
  }

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

  // ✅ replaced — alert() ki jagah toast
  onSaveSubmit(): void {
    if (!this.formData.studentId || !this.formData.academicSessionId) {
      this.showToast('error', 'Please select a student and an academic session.');
      return;
    }
    if (!this.formData.feeMonth || !this.formData.feeYear) {
      this.showToast('error', 'Fee month and year are required.');
      return;
    }

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
      next: (res: any) => {
        this.isLoading = false;
        this.showToast('success', res?.message || (this.isEditMode ? 'Fee record updated successfully!' : 'Fee entry created successfully!'));
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showToast('error', err?.error?.message || 'Failed to save fee record. Please try again.');
      }
    });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.popupType = type;
    this.popupMessage = message;
    this.showResultPopup = true;
    this.cdr.markForCheck();
    this.startPopupTimer();
  }

  private startPopupTimer(): void {
    if (this.popupTimer) clearTimeout(this.popupTimer);
    this.popupTimer = setTimeout(() => this.closePopup(), this.POPUP_DURATION);
  }

  closePopup(): void {
    if (this.popupTimer) { clearTimeout(this.popupTimer); this.popupTimer = null; }
    const wasSuccess = this.popupType === 'success';
    this.showResultPopup = false;
    this.cdr.markForCheck();
    if (wasSuccess) {
      this.router.navigate(['../list'], { relativeTo: this.route });
    }
  }
}