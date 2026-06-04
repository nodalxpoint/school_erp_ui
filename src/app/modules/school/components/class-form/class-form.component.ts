import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SchoolService } from '../../services/school.service';
import { CreateClassRequest } from '../../models/school.model';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './class-form.component.html',
  styleUrls: ['./class-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassFormComponent implements OnInit, OnDestroy {
  // Emits after successful save so parent can refresh list
  @Output() classSaved = new EventEmitter<void>();

  classForm!: FormGroup;
  isSubmitting = false;

  // Edit mode — when user wants to add sections to existing class
  isEditMode = false;

  toast: ToastState = { visible: false, type: 'success', message: '' };
  private toastTimer?: ReturnType<typeof setTimeout>;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private schoolService: SchoolService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._buildForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private _buildForm(): void {
    this.classForm = this.fb.group({
      // toggle: create new class OR add sections to existing
      mode: ['create'],
      className: [''],
      existingClassId: [''],
      sections: this.fb.array([this._newSectionControl()]),
    });

    // Watch mode toggle
    this.classForm.get('mode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isEditMode = this.classForm.get('mode')?.value === 'addSections';
        this.cdr.markForCheck();
      });
  }

  private _newSectionControl() {
    return this.fb.control('');
  }

  get sectionsArray(): FormArray {
    return this.classForm.get('sections') as FormArray;
  }

  get sectionControls() {
    return this.sectionsArray.controls;
  }

  addSection(): void {
    this.sectionsArray.push(this._newSectionControl());
    this.cdr.markForCheck();
  }

  removeSection(index: number): void {
    if (this.sectionsArray.length > 1) {
      this.sectionsArray.removeAt(index);
      this.cdr.markForCheck();
    }
  }

  onSubmit(): void {
    const mode = this.classForm.get('mode')?.value;
    const className = this.classForm.get('className')?.value?.trim();
    const existingClassId = this.classForm.get('existingClassId')?.value?.trim();

    // Build sections array — filter out empty strings
    const sections: string[] = this.sectionsArray.value
      .map((s: string) => s?.trim().toUpperCase())
      .filter((s: string) => !!s);

    const payload: CreateClassRequest = {
      className: mode === 'create' ? className : '',
      classId: mode === 'addSections' ? existingClassId : '',
      sections,
    };

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.schoolService
      .saveClass(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.showToast('success', res?.message ?? 'Class saved successfully!');
          this._resetForm();
          this.classSaved.emit();
        },
        error: (err) => {
          this.showToast('error', err?.error?.message ?? 'Failed to save. Please try again.');
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  private _resetForm(): void {
    this.isSubmitting = false;
    this.classForm.reset({ mode: 'create' });
    // Reset sections to one empty field
    while (this.sectionsArray.length > 1) {
      this.sectionsArray.removeAt(1);
    }
    this.sectionsArray.at(0).setValue('');
    this.cdr.markForCheck();
  }

  showToast(type: 'success' | 'error', message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, type, message };
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toast.visible = false;
      this.cdr.markForCheck();
    }, 4000);
  }
}