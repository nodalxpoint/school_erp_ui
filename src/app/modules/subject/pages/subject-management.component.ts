import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../services/subject.service';
import { SubjectResponseDto, SubjectFilterRequest, CreateSubjectDto } from '../models/subject.model';

@Component({
  selector: 'app-subject-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-management.component.html',
  styleUrls: ['./subject-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubjectManagementComponent implements OnInit {
  subjects: SubjectResponseDto[] = [];
  isLoading = false;
  totalElements = 0;
  totalPages = 0;

  // Sidebar visibility flags
  isSidebarOpen = false;
  isSaving = false;

  // Form Model
  formModel: CreateSubjectDto = { subjectName: '', subjectCode: '' };

  // Filter Request state
  filter: SubjectFilterRequest = {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    // sortDirection: 'desc'
  };
  searchText = '';

  constructor(
    private subjectService: SubjectService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.subjectService.filterSubjects({
      ...this.filter,
      name: this.searchText.trim() || undefined
    }).subscribe({
      next: (res: any) => {
        // Mapping as per PagedResponse implementation
        this.subjects = res?.data ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void {
    this.filter.page = 0;
    this.loadSubjects();
  }

  onClearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  onPageChange(pageIndex: number): void {
    this.filter.page = pageIndex;
    this.loadSubjects();
  }

  // Open pane for adding
  onAddSubject(): void {
    this.formModel = { subjectName: '', subjectCode: '' };
    this.isSidebarOpen = true;
    this.cdr.markForCheck();
  }

  // Open pane for editing
  onEditSubject(sub: SubjectResponseDto): void {
    this.formModel = {
      id: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code
    };
    this.isSidebarOpen = true;
    this.cdr.markForCheck();
  }

  onCloseSidebar(): void {
    this.isSidebarOpen = false;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.formModel.subjectName || !this.formModel.subjectCode) return;

    this.isSaving = true;
    this.subjectService.addOrUpdateSubject(this.formModel).subscribe({
      next: () => {
        this.isSaving = false;
        this.isSidebarOpen = false;
        this.loadSubjects();
      },
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  get safeSubjects(): SubjectResponseDto[] { return this.subjects ?? []; }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get currentPage(): number { return this.filter.page; }

  trackById(_: number, item: SubjectResponseDto): string {
    return item.id ?? '';
  }
}