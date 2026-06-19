// src/app/modules/exam-schedule/components/exam-schedule-form/exam-schedule-form.component.ts

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    
    this.scheduleService.getExamsWithSubjects({ page: 0, size: 100 }).subscribe({
      next: (res) => {
        this.examTerms = (res.data ?? []).map(e => ({ id: e.examId, label: e.examName }));
        
        this.route.queryParams.subscribe(params => {
          if (!this.isEditMode) {
            if (params['examId']) this.formModel.examId = params['examId'];
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
      this.scheduleService.getExamsWithSubjects({ page: 0, size: 100 }).subscribe(res => {
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

  onSubmit(): void {
    this.isSaving = true;
    this.cdr.markForCheck();

    this.scheduleService.addOrUpdateExamSubject(this.formModel).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/exam-schedule']);
      },
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/exam-schedule']);
  }
}