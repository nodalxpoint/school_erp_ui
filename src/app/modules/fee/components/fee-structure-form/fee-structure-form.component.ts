import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeeService } from '../../services/fee.service';
import { SaveFeeStructureRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

@Component({
  selector: 'app-fee-structure-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-structure-form.component.html',
  styleUrls: ['./fee-structure-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeeStructureFormComponent implements OnInit {
  isEditMode = false;
  isLoading = false;
  classes: DropdownOption[] = [];
  academicSessions: DropdownOption[] = [];

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  formData: SaveFeeStructureRequest = {
    classId: '',
    feeName: 'TUTION FEE',
    amount: 0,
    frequency: 'MONTHLY',
    dueDate: '',
    academicSessionId: ''
  };

  constructor(
    private feeService: FeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.feeService.getParams('classes').subscribe(data => {
      this.classes = data;
      this.cdr.markForCheck();
    });

    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.academicSessions = data;
      if (!this.isEditMode && data.length > 0) {
        this.formData.academicSessionId = data[0].id;
      }
      this.cdr.markForCheck();
    });

    const editId = this.route.snapshot.paramMap.get('id');
    const stateData = history.state?.data;

    if (editId || stateData) {
      this.isEditMode = true;
      if (stateData) {
        this.formData = {
          id: stateData.id,
          classId: stateData.classId || '',
          feeName: stateData.feeName || '',
          amount: stateData.amount || 0,
          frequency: stateData.frequency || 'MONTHLY',
          dueDate: stateData.dueDate ? stateData.dueDate.substring(0, 10) : '',
          academicSessionId: stateData.academicSessionId || ''
        };
      } else if (editId) {
        this.formData.id = editId;
      }
    }
  }

  private fireToast(type: 'success' | 'error', message: string): void {
    clearTimeout(this.toastTimer);
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
    this.cdr.markForCheck();
  }

  // 🔑 Ek hi jagah se navigation hoga, absolute path se — relative path ki dikkat khatam
  private goToList(): void {
    this.router.navigate(['list'], { relativeTo: this.route.parent })
      .then(success => {
        if (!success) {
          console.error('Navigation to list failed — route config check karo (list route parent ke andar sibling hai ya nahi).');
        }
      })
      .catch(err => console.error('Navigation error:', err));
  }

  onCancel(): void {
    this.goToList();
  }

  onSaveSubmit(): void {
    if (!this.formData.classId) {
      this.fireToast('error', 'Please select a class.');
      return;
    }
    if (!this.formData.academicSessionId) {
      this.fireToast('error', 'Please select an academic session.');
      return;
    }
    if (!this.formData.feeName?.trim()) {
      this.fireToast('error', 'Fee name is required.');
      return;
    }
    if (!this.formData.amount || this.formData.amount <= 0) {
      this.fireToast('error', 'Please enter a valid amount.');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const payload: SaveFeeStructureRequest = {
      ...this.formData,
      dueDate: this.formData.dueDate || null   
    };

    this.feeService.saveFeeStructure(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.cdr.markForCheck();               // 👈 missing tha, isi wajah se button stuck tha

        const msg = response?.message || 'Fee structure saved successfully';
        this.fireToast('success', msg);

        this.toastTimer = setTimeout(() => {
          this.goToList();
        }, 900);
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.markForCheck();               // 👈 ye already tha, sahi hai
        const msg = err?.error?.message || 'Failed to save. Please try again.';
        this.fireToast('error', msg);
      }
    });
  }
}