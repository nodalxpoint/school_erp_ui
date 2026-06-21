import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamMarksService } from '../../services/exam-marks.service';
import { StudentMarksRecordDto, ExamMarksSavePayload } from '../../models/exam-marks.model';

@Component({
  selector: 'app-exam-marks-entry-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-marks-entry-form.component.html',
  styleUrls: ['./exam-marks-entry-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamMarksEntryFormComponent implements OnInit {
  studentRecords: StudentMarksRecordDto[] = [];
  isLoading = false;
  isSaving = false;

  // Route queries params trackers
  examSubjectId = '';
  examId = '';
  academicSessionId = '';
  subjectName = '';
  examName = '';

  // ✅ Direct dynamic trackers forwarded from list page
  classId = '';
  sectionId = '';

  // ⚠️ Note: maxMarks intentionally NOT tracked here — students/list backend
  // response has no maxMarks field, so we don't fake/hardcode it on the frontend.

  constructor(
    private marksService: ExamMarksService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.examSubjectId = params['subjectId'] || '';
      this.examId = params['examId'] || '';
      this.academicSessionId = params['sessionId'] || '';
      this.subjectName = params['subjectName'] || 'Subject';
      this.examName = params['examName'] || '';

      // ✅ Forwarded metadata from list page
      this.classId = params['classId'] || '';
      this.sectionId = params['sectionId'] || '';

      if (this.examSubjectId && this.classId && this.sectionId) {
        this.fetchStudentsFromBackend(this.classId, this.sectionId);
      }
    });
  }

  // ✅ Hits POST `/students/list` directly with raw response data, no client-side max marks handling
  fetchStudentsFromBackend(classId: string, sectionId: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.marksService.getStudentsByClassSection(classId, sectionId).subscribe({
      next: (res) => {
        const rawStudents = res.data ?? [];

        this.studentRecords = rawStudents.map((stud: any) => ({
          studentId: stud.id,
          studentName: stud.firstName + ' ' + (stud.lastName || ''),
          rollNo: stud.rollNo || 'N/A',
          className: stud.className || '',
          sectionName: stud.sectionName || '',
          marksObtained: 0,
          remarks: 'Evaluated'
        }));

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  onSubmitMarks(): void {
    if (this.studentRecords.length === 0) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    const finalPayload: ExamMarksSavePayload = {
      examSubjectId: this.examSubjectId,
      examId: this.examId,
      academicSessionId: this.academicSessionId,
      records: this.studentRecords.map(r => ({
        studentId: r.studentId,
        marksObtained: Number(r.marksObtained || 0),
        remarks: 'Evaluated'
      }))
    };

    this.marksService.saveStudentExamMarks(finalPayload).subscribe({
      next: () => {
        this.isSaving = false;
        alert('Marks submitted successfully!');
        this.onGoBack();
      },
      error: () => { this.isSaving = false; this.cdr.markForCheck(); }
    });
  }

  onGoBack(): void {
    this.router.navigate(['/exam-marks']);
  }
}