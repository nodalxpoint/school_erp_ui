import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService, ParamDropdownOption } from '../../services/subject.service';
import { SubjectTeacherAssignmentResponseDto, SubjectTeacherAssignmentFilterRequest, AssignSubjectTeacherDto } from '../../models/subject.model';

@Component({
  selector: 'app-subject-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-assignment.component.html',
  styleUrls: ['./subject-assignment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubjectAssignmentComponent implements OnInit {
  assignments: SubjectTeacherAssignmentResponseDto[] = [];
  isLoading = false;
  totalElements = 0;
  totalPages = 0;
  isFormOpen = false;
  isSaving = false;

  // Dropdowns Lists state
  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  teachers: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  // Table Filter State
  filter: SubjectTeacherAssignmentFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'DESC',
    classId: '', sectionId: '', teacherId: '', subjectId: '', academicSessionId: ''
  };

  // Assign Form Payload Model
  formModel: AssignSubjectTeacherDto = {
    subjectId: '', teacherId: '', classId: '', sectionId: '', academicSessionId: ''
  };

  constructor(private subjectService: SubjectService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAssignments();
    this.loadDropdownContexts();
  }

  loadDropdownContexts(): void {
    this.subjectService.getDropdownOptions('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.subjectService.getDropdownOptions('teachers').subscribe(data => { this.teachers = data; this.cdr.markForCheck(); });
    this.subjectService.getDropdownOptions('subjects').subscribe(data => { this.subjects = data; this.cdr.markForCheck(); });
    this.subjectService.getDropdownOptions('academic_sessions').subscribe(data => { this.sessions = data; this.cdr.markForCheck(); });
  }

  onFilterClassChange(classId: string): void {
    this.filter.sectionId = '';
    this.sections = [];
    if (classId) {
      this.subjectService.getSectionOptions(classId).subscribe(data => {
        this.sections = data;
        this.cdr.markForCheck();
      });
    }
    this.onApplyFilters();
  }

  onFormClassChange(classId: string): void {
    this.formModel.sectionId = '';
    this.sections = [];
    if (classId) {
      this.subjectService.getSectionOptions(classId).subscribe(data => {
        this.sections = data;
        this.cdr.markForCheck();
      });
    }
  }

  loadAssignments(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Clean empty strings for request cleanliness
    const cleanFilter: any = { ...this.filter };
    Object.keys(cleanFilter).forEach(key => {
      if (cleanFilter[key] === '') cleanFilter[key] = undefined;
    });

    this.subjectService.filterSubjectTeacherAssignments(cleanFilter).subscribe({
      next: (res) => {
        this.assignments = res.data ?? [];
        this.totalElements = res.totalElements ?? 0;
        this.totalPages = res.totalPages ?? 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApplyFilters(): void {
    this.filter.page = 0;
    this.loadAssignments();
  }

  onPageChange(p: number): void {
    this.filter.page = p;
    this.loadAssignments();
  }

  onOpenForm(): void {
    this.formModel = { subjectId: '', teacherId: '', classId: '', sectionId: '', academicSessionId: '' };
    this.isFormOpen = true;
    this.cdr.markForCheck();
  }

  onSubmitAssignment(): void {
    this.isSaving = true;
    this.subjectService.assignSubjectTeacher(this.formModel).subscribe({
      next: () => {
        this.isSaving = false;
        this.isFormOpen = false;
        this.loadAssignments();
      },
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get currentPage(): number { return this.filter.page; }
}