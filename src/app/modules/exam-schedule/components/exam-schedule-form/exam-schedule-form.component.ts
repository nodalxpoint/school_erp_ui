import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamScheduleService, ParamDropdownOption } from '../../services/exam-schedule.service';
import { ExamSubjectDto } from '../../models/exam-schedule.model';

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

  classes: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  examTerms: ParamDropdownOption[] = [];

  formModel: ExamSubjectDto = {
    examId: '', classId: '', subjectId: '',
    maxMarks: 100, passingMarks: 33, examDate: ''
  };

  constructor(
    private scheduleService: ExamScheduleService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFormDropdownContexts();
  }
loadFormDropdownContexts(): void {
    this.scheduleService.getDropdownOptions('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.scheduleService.getDropdownOptions('subjects').subscribe(data => { this.subjects = data; this.cdr.markForCheck(); });
    
    this.scheduleService.getExamsWithSubjects({ page: 0, size: 100 }).subscribe(res => {
      this.examTerms = (res.data ?? []).map(e => ({ id: e.examId, label: e.examName }));
      
      this.route.queryParams.subscribe(params => {
        if (params['examId']) this.formModel.examId = params['examId'];
        if (params['classId']) this.formModel.classId = params['classId'];
        this.checkEditModeAndPopulate();
        this.cdr.markForCheck();
      });
    });
  }

  checkEditModeAndPopulate(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['schedule']) {
        this.formModel = { ...navigation.extras.state['schedule'] };
      }
    }
    this.cdr.markForCheck();
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