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

  // Auto-suggest student matrix management variables
  studentSearchToken = '';
  dynamicStudentsList: any[] = [];
  showSuggestions = false;
  selectedStudentObj: any | null = null;

  formData: SaveFeeRequest = {
    studentId: '', academicSessionId: '',
    feeMonth: new Date().getMonth() + 1, feeYear: new Date().getFullYear(),
    amount: 0, dueDate: '', paymentStatus: 'PENDING', remarks: ''
  };

  constructor(
    private feeService: FeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load sessions dropdown first
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      this.cdr.markForCheck();
    });

    // Check if deep navigated into an active edit route
    const editId = this.route.snapshot.paramMap.get('id');
    const stateData = history.state?.data;

    if (editId || stateData) {
      this.isEditMode = true;
      if (stateData) {
        this.mapIncomingEditForm(stateData);
      } else if (editId) {
        // Fallback safety lookup if any
        this.formData.feeId = editId;
      }
    }
  }

  mapIncomingEditForm(data: any): void {
    this.formData = {
      feeId: data.id,
      studentId: data.studentId,
      academicSessionId: data.academicSessionId,
      feeMonth: data.feeMonth,
      feeYear: data.feeYear,
      amount: data.amount,
      dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
      paymentStatus: data.paymentStatus,
      remarks: data.remarks || ''
    };
    
    // Set static profile visual representation mockup for edit state preview node safely
    this.selectedStudentObj = { firstName: data.studentName || 'Student', lastName: '', id: data.studentId };
    this.studentSearchToken = data.studentName || '';
  }

  // ── Auto Suggest Student Interaction Logic Methods ──
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

 // FeeFormComponent ke navigate code ko isse replace kar lo:
  onCancel(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }

  onSaveSubmit(): void {
    if (!this.formData.studentId || !this.formData.academicSessionId || !this.formData.amount) {
      alert('Parameters required (Student ID selection, Session, and Amount)!');
      return;
    }

    this.feeService.saveFee(this.formData).subscribe({
      next: () => {
        // Safe dispatch back to ledger list matrix screen
        this.router.navigate(['../list'], { relativeTo: this.route });
      },
      error: () => {
        alert('Error posting transaction ledger parameters.');
      }
    });
  }
}