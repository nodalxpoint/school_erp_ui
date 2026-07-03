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

  formData: SaveFeeStructureRequest = {
    classId: '',
    feeName: '',
    amount: 0,
    frequency: 'MONTHLY'
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
          frequency: stateData.frequency || 'MONTHLY'
        };
      } else if (editId) {
        this.formData.id = editId;
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }

  onSaveSubmit(): void {
    if (!this.formData.classId) {
      alert('Please select a class.');
      return;
    }
    if (!this.formData.feeName?.trim()) {
      alert('Fee name is required.');
      return;
    }
    if (!this.formData.amount || this.formData.amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.feeService.saveFeeStructure(this.formData).subscribe({
      next: () => {
        this.router.navigate(['../list'], { relativeTo: this.route });
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        const msg = err?.error?.message || 'Failed to save. Please try again.';
        alert(msg);
      }
    });
  }
}
