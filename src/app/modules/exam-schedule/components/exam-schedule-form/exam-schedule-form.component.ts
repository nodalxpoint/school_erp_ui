// src/app/modules/exam-schedule/components/exam-schedule-form/exam-schedule-form.component.ts

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamScheduleService, ParamDropdownOption } from '../../services/exam-schedule.service';
import { ExamSubjectDto } from '../../models/exam-schedule.model';
import { AuthStateService } from '../../../../core/auth/auth-state.service'; // ✅ Added for role checking

@Component({
  selector: 'app-exam-schedule-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-schedule-form.component.html',
  styleUrls: ['./exam-schedule-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamScheduleFormComponent implements OnInit {
  isEditMode = false;
  isSaving = false;
  isAdmin = false; // ✅ Track if current user is admin
  errorMessage = '';

  classes: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  examTerms: ParamDropdownOption[] = [];

  formModel: ExamSubjectDto = {
    id: undefined,
    examId: '', 
    classId: '', 
    subjectId: '',
    maxMarks: 100, 
    passingMarks: 33, 
    examDate: ''
  };

   showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

  constructor(
    private scheduleService: ExamScheduleService,
    private authState: AuthStateService, // ✅ Injected safely
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    // Capture state data immediately in the constructor
    const currentNav = this.router.getCurrentNavigation();
    const stateData = currentNav?.extras.state?.['schedule'] || history.state?.['schedule'];
    
    if (stateData) {
      this.isEditMode = true;
      this.populateFormFields(stateData);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
    }

    // ✅ Check user role context
    this.authState.user$.subscribe(user => {
      if (user) {
        this.isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
        this.cdr.markForCheck();
      }
    });

    this.loadFormDropdownContexts();
  }

  populateFormFields(data: any): void {
    this.formModel.id = data.id;
    this.formModel.examId = data.examId || '';
    this.formModel.classId = data.classId || '';
    this.formModel.subjectId = data.subjectId || '';
    this.formModel.maxMarks = data.maxMarks ?? 100;
    this.formModel.passingMarks = data.passingMarks ?? 33;
    
    if (data.examDate) {
      this.formModel.examDate = data.examDate.substring(0, 10);
    }
    this.cdr.markForCheck();
  }

  loadFormDropdownContexts(): void {
    this.scheduleService.getDropdownOptions('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.scheduleService.getDropdownOptions('subjects').subscribe(data => { this.subjects = data; this.cdr.markForCheck(); });
    
    this.scheduleService.getExamsWithSubjects({ page: 0, size: 100, isActive: 'Y' }).subscribe({
      next: (res) => {
        const rawExams = res.data ?? [];
        this.examTerms = rawExams.map(e => ({
          id: e.examId || (e as any).id,
          label: e.examName,
          isActive: e.isActive === 'Y' || e.isActive === true || String(e.isActive).toUpperCase() === 'Y'
        }));

        this.route.queryParams.subscribe(params => {
          if (!this.isEditMode) {
            if (params['examId']) {
              this.formModel.examId = params['examId'];
            } else {
              const activeExam = this.examTerms.find(e => e.isActive);
              if (activeExam) {
                this.formModel.examId = activeExam.id;
              }
            }
            if (params['classId']) this.formModel.classId = params['classId'];
          }
          this.checkFallbackRoutingLoad();
          this.cdr.markForCheck();
        });
      }
    });
  }

  checkFallbackRoutingLoad(): void {
    const pathId = this.route.snapshot.paramMap.get('id');
    if (pathId && (!this.formModel.subjectId || !this.formModel.examId)) {
      this.scheduleService.getExamsWithSubjects({ page: 0, size: 100, isActive: 'Y' }).subscribe(res => {
        const activeExams = res.data ?? [];
        for (const exam of activeExams) {
          if (exam.subjects) {
            const targetSubject = exam.subjects.find(sub => sub.id === pathId);
            if (targetSubject) {
              this.populateFormFields(targetSubject);
              break;
            }
          }
        }
      });
    }
  }

  onSubmit(form: NgForm): void {
    // ✅ naya — pehle yaha koi validity check hi nahi tha, form invalid hote hue bhi
    // seedha save call ja sakti thi. Ab required fields check hoga, touched mark hoga
    // (red errors dikhne ke liye) aur ek clear toast bhi dikhega.
    if (form.invalid) {
      form.form.markAllAsTouched();
      this.popupType = 'error';
      this.popupMessage = 'Please fill all the required fields correctly before submitting.';
      this.showResultPopup = true;
      this.cdr.markForCheck();
      this.startPopupTimer();
      return;
    }

    // ✅ naya — passing marks max marks se zyada na ho, ye bhi ek basic sanity check hai
    if (this.formModel.passingMarks != null && this.formModel.maxMarks != null &&
        Number(this.formModel.passingMarks) > Number(this.formModel.maxMarks)) {
      this.popupType = 'error';
      this.popupMessage = 'Passing marks cannot be greater than maximum marks.';
      this.showResultPopup = true;
      this.cdr.markForCheck();
      this.startPopupTimer();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.scheduleService.addOrUpdateExamSubject(this.formModel).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        this.popupType = 'success';
        this.popupMessage = res?.message || (this.isEditMode ? 'Exam subject updated successfully!' : 'Exam subject allocated successfully!');
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();
      },
      error: (err: any) => {
        this.isSaving = false;

        this.popupType = 'error';
        this.popupMessage = err?.error?.message || 'Failed to save. Please try again.';
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();
      }
    });
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
      // ✅ naya — jis class/exam ke liye paper abhi create/update hua,
      // wahi list page ko navigation state ke through bhej do taaki
      // list page wapas jaake wahi class dikhaye (sessionStorage wale
      // purane filter se override karke)
      this.router.navigate(['/exam-schedule'], {
        state: {
          justCreatedClassId: this.formModel.classId,
          justCreatedExamId: this.formModel.examId
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/exam-schedule']);
  }
}