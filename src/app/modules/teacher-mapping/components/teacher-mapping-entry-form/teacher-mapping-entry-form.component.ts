import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamMarksService } from '../../services/teacher-mapping.service';
import { StudentMarksRecordDto, ExamMarksSavePayload } from '../../models/teacher-mapping.model';

@Component({
  selector: 'app-exam-marks-entry-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-mapping-entry-form.component.html',
  styleUrls: ['./teacher-mapping-entry-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherMappingEntryFormComponent implements OnInit {
  studentRecords: StudentMarksRecordDto[] = [];
  isLoading = false;
  isSaving = false;

  // Route queries params trackers
  examSubjectId = '';
  examId = '';
  academicSessionId = '';
  subjectName = '';
  examName = '';

  // Direct dynamic trackers forwarded from list page
  classId = '';
  sectionId = '';

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

      // Forwarded metadata from list page
      this.classId = params['classId'] || '';
      this.sectionId = params['sectionId'] || '';

      if (this.examSubjectId && this.classId && this.sectionId) {
        // ✅ Ab data fetch karte waqt list function me examId bhi pass hoga
        this.fetchStudentsFromBackend(this.classId, this.sectionId, this.examId);
      }
    });
  }

  // ✅ UPDATED: Function parameters accepts examId for dynamic payload injection
  fetchStudentsFromBackend(classId: string, sectionId: string, examId: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.marksService.getStudentsByClassSection(classId, sectionId, examId).subscribe({
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