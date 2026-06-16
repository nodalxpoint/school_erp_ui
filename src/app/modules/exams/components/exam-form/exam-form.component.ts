import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamDto } from '../../models/exam.model';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss'], // Same variables shared cleanly
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamFormComponent implements OnInit {
  isEditMode = false;
  isSaving = false;
  sessions: ParamDropdownOption[] = [];

  formModel: ExamDto = {
    academicSessionId: '', examName: '', startDate: '', endDate: ''
  };

  constructor(
    private examService: ExamService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSessionsAndData();
  }

  loadSessionsAndData(): void {
    this.examService.getAcademicSessions().subscribe(data => {
      this.sessions = data;
      if (!this.isEditMode && this.sessions.length > 0) {
        this.formModel.academicSessionId = this.sessions[0].id;
      }
      this.checkEditMode();
      this.cdr.markForCheck();
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['exam']) {
        this.formModel = { ...navigation.extras.state['exam'] };
      } else {
        // Fallback route strategy if user performs a hard reload on this page
        this.examService.getExamsList({ page: 0, size: 100 }).subscribe(res => {
          const matched = res.data?.find(e => e.id === id);
          if (matched) {
            this.formModel = { ...matched };
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  onSubmit(): void {
    if (!this.formModel.examName || !this.formModel.startDate || !this.formModel.endDate) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    this.examService.addOrUpdateExam(this.formModel).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/exams']);
      },
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/exams']);
  }
}