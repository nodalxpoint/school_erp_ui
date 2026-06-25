import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamMarksService } from '../../services/exam-marks.service';
import { ExamMarksResponseDto, ExamMarksFilterRequest, StudentSuggestion } from '../../models/exam-marks.model';
import { DropdownOption } from '../../../student/models/student.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-exam-marks-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-marks-list.component.html',
  styleUrls: ['./exam-marks-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamMarksListComponent implements OnInit {

  // ── Table Data ────────────────────────────────────────────────
  marksRecords: ExamMarksResponseDto[] = [];
  loading       = false;
  error         = '';

  // ── Filter State ──────────────────────────────────────────────
  searchStudentName  = '';   // input mein dikhne wala naam
  selectedStudentId  = '';   // suggestion se pick hua student ID
  selectedExamId     = '';
  selectedSubjectId  = '';
  selectedClassId    = '';
  selectedSectionId  = '';

  // ── Dropdown Lists ────────────────────────────────────────────
  exams:    DropdownOption[] = [];
  subjects: DropdownOption[] = [];
  classes:  DropdownOption[] = [];
  sections: DropdownOption[] = [];

  loadingClasses  = false;
  loadingSections = false;

  // ── Student Autocomplete ──────────────────────────────────────
  suggestedStudents: StudentSuggestion[] = [];
  showSuggestions   = false;
  searchingStudents = false;
  private studentSearch$ = new Subject<string>();

  // ── Pagination ────────────────────────────────────────────────
  currentPage   = 0;
  pageSize      = 10;
  totalElements = 0;
  totalPages    = 0;

  constructor(
    private marksService: ExamMarksService,
    private cdr: ChangeDetectorRef
  ) {}

  // ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDropdowns();
    this.setupStudentAutocomplete();
    // Page open hote hi koi data nahi dikhana — sirf Search click pe loadExamMarks() chalega
  }

  // ── 1. Page open hote hi 4 dropdowns load: classes, subjects, exams, sections ──
  // Sections yahan bina classId ke aati hain — section <select> tab tak disabled
  // rahega jab tak user koi class select na kare (UI me [disabled]="!selectedClassId").
  // Class select hone par onClassFilterChange() sections ko classId ke saath
  // dobara (sahi filtered) fetch karta hai.
  loadDropdowns(): void {
    this.loadingClasses = true;
    this.cdr.markForCheck();

    // Classes
    this.marksService.getDropdownOptions('classes').subscribe({
      next: data => { this.classes = data; this.loadingClasses = false; this.cdr.markForCheck(); },
      error: ()   => { this.loadingClasses = false; this.cdr.markForCheck(); }
    });

    // Subjects — type: 'subjects' POST /param/list
    this.marksService.getDropdownOptions('subjects').subscribe({
      next: data => { this.subjects = data; this.cdr.markForCheck(); }
    });

    // Exams — type: 'exams' POST /param/list
    this.marksService.getDropdownOptions('exams').subscribe({
      next: data => { this.exams = data; this.cdr.markForCheck(); }
    });

    // Sections — type: 'sections' POST /param/list (bina classId, initial load)
    this.loadingSections = true;
    this.cdr.markForCheck();
    this.marksService.getDropdownOptions('sections').subscribe({
      next: data => { this.sections = data; this.loadingSections = false; this.cdr.markForCheck(); },
      error: ()   => { this.loadingSections = false; this.cdr.markForCheck(); }
    });
  }

  // ── 2. Class change → sections classId ke saath re-fetch, section reset ─────
  onClassFilterChange(): void {
    this.selectedSectionId = '';
    this.sections          = [];

    if (this.selectedClassId) {
      this.loadingSections = true;
      this.cdr.markForCheck();

      // type: 'sections' + classId → POST /param/list (filtered sections)
      this.marksService.getDropdownOptions('sections', this.selectedClassId).subscribe({
        next: data => { this.sections = data; this.loadingSections = false; this.cdr.markForCheck(); },
        error: ()   => { this.loadingSections = false; this.cdr.markForCheck(); }
      });
    }

    this.cdr.markForCheck();
  }

  // ── 3. Student autocomplete — debounced POST /students/list ──
  setupStudentAutocomplete(): void {
    this.studentSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      // previous pending request cancel ho jata hai switchMap se
      switchMap(term => {
        if (!term.trim()) {
          this.suggestedStudents = [];
          this.showSuggestions   = false;
          this.searchingStudents = false;
          this.cdr.markForCheck();
          return [];   // empty observable — koi API call nahi
        }

        this.searchingStudents = true;
        this.cdr.markForCheck();

        return this.marksService.searchStudents(term);
      })
    ).subscribe({
      next: students => {
        this.suggestedStudents = students;
        this.showSuggestions   = students.length > 0;
        this.searchingStudents = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.suggestedStudents = [];
        this.showSuggestions   = false;
        this.searchingStudents = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── 4. Input change — push to autocomplete stream ────────────
  onStudentInputChange(): void {
    this.selectedStudentId = ''; // naam edit hua → old ID clear
    this.studentSearch$.next(this.searchStudentName);
  }

  // ── 5. Suggestion click — set student, hide dropdown ─────────
  selectStudent(student: StudentSuggestion): void {
    this.searchStudentName = `${student.firstName} ${student.lastName ?? ''}`.trim();
    this.selectedStudentId = student.id;
    this.showSuggestions   = false;
    this.suggestedStudents = [];
    this.cdr.markForCheck();
  }

  // ── 6. SEARCH BUTTON — tabhi examMarks/list call hogi ────────
  onSearchTrigger(): void {
    this.currentPage     = 0;
    this.showSuggestions = false;
    this.loadExamMarks();
  }

  // ── 7. Main API — POST /examMarks/list ───────────────────────
  loadExamMarks(): void {
    this.loading = true;
    this.error   = '';
    this.cdr.markForCheck();

    const req: ExamMarksFilterRequest = {
      page:          this.currentPage,
      size:          this.pageSize,
      sortBy:        'id',
      sortDirection: 'ASC',

      // Student: ID (suggestion se) ya firstName (free text) — dono kabhi saath nahi
      ...(this.selectedStudentId
            ? { studentId: this.selectedStudentId }
            : this.searchStudentName.trim()
              ? { firstName: this.searchStudentName.trim() }
              : {}),

      ...(this.selectedClassId   ? { classId:   this.selectedClassId   } : {}),
      ...(this.selectedSectionId ? { sectionId: this.selectedSectionId } : {}),
      ...(this.selectedSubjectId ? { subjectId: this.selectedSubjectId } : {}),
      ...(this.selectedExamId    ? { examId:    this.selectedExamId    } : {}),
    };

    console.log('[ExamMarks] POST /examMarks/list payload:', req);

    this.marksService.filterExamMarks(req).subscribe({
      next: res => {
        // Har examSubject entry ke records[] ko flatten karke alag rows banao
        const rawData = res.data ?? [];
        this.marksRecords = rawData.flatMap(entry =>
          (entry.records ?? []).map(rec => ({
            id:            entry.id,
            examId:        entry.examId,
            examSubjectId: entry.examSubjectId,
            examName:      entry.examName,
            subjectName:   entry.subjectName,
            studentId:     rec.studentId,
            studentName:   rec.studentName,
            className:     rec.className,
            sectionName:   rec.sectionName,
            marksObtained: rec.marksObtained,
            remarks:       rec.remarks,
            // admissionNo, rollNo, maxMarks — abhi backend nahi de raha,
            // jab dega to yaha se table me show ho jayenge
          } as ExamMarksResponseDto))
        );
        this.totalElements = res.totalElements ?? 0;
        this.totalPages    = res.totalPages    ?? 0;
        this.loading       = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('[ExamMarks] Error:', err);
        this.error        = 'Exam marks load nahi ho sake. Please retry.';
        this.loading      = false;
        this.marksRecords = [];
        this.cdr.markForCheck();
      }
    });
  }

  // ── 8. Reset all filters ──────────────────────────────────────
  clearAllFilters(): void {
    this.searchStudentName = '';
    this.selectedStudentId = '';
    this.selectedExamId    = '';
    this.selectedSubjectId = '';
    this.selectedClassId   = '';
    this.selectedSectionId = '';
    this.currentPage       = 0;
    this.showSuggestions   = false;
    this.loadExamMarks();
  }

  // ── 9. Blur — close suggestions after mousedown registers ────
  closeSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.cdr.markForCheck();
    }, 200);
  }

  // ── 10. Pagination ────────────────────────────────────────────
  goToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.totalPages) return;
    this.currentPage = pageIndex;
    this.loadExamMarks();
  }

  // ── Helpers ───────────────────────────────────────────────────
  hasActiveFilters(): boolean {
    return !!(
      this.searchStudentName || this.selectedStudentId ||
      this.selectedExamId    || this.selectedSubjectId ||
      this.selectedClassId   || this.selectedSectionId
    );
  }

  get pages(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    let start   = Math.max(0, cur - 2);
    let end     = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end   = Math.min(total - 1, 4);
      else             start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startIndex(): number { return this.currentPage * this.pageSize + 1; }
  get endIndex():   number { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }
}