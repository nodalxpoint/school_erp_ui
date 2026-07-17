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

  isSidebarOpen = false;
  isSaving = false;

  formModel: CreateSubjectDto = { subjectName: '', subjectCode: '' };

  filter: SubjectFilterRequest = {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
  };
  searchText = '';
  includeDeleted = false;

  // ✅ naya — confirm popup (delete + restore dono ke liye reuse)
  showConfirm = false;
  confirmMode: 'delete' | 'restore' = 'delete';
  subjectToActOn: SubjectResponseDto | null = null;
  confirming = false;

  // ✅ naya — result toast
  showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

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
      name: this.searchText.trim() || undefined,
      includeDeleted: this.includeDeleted
    }).subscribe({
      next: (res: any) => {
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

  onAddSubject(): void {
    this.formModel = { subjectName: '', subjectCode: '' };
    this.isSidebarOpen = true;
    this.cdr.markForCheck();
  }

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

  // ✅ replaced — confirm() ki jagah popup
  onDeleteSubject(sub: SubjectResponseDto): void {
    if (!sub.id) return;
    this.subjectToActOn = sub;
    this.confirmMode = 'delete';
    this.showConfirm = true;
    this.cdr.markForCheck();
  }

  onRestoreSubject(sub: SubjectResponseDto): void {
    if (!sub.id) return;
    this.subjectToActOn = sub;
    this.confirmMode = 'restore';
    this.showConfirm = true;
    this.cdr.markForCheck();
  }

  cancelConfirm(): void {
    this.showConfirm = false;
    this.subjectToActOn = null;
    this.cdr.markForCheck();
  }

  proceedConfirm(): void {
    if (this.confirming) return;
    if (!this.subjectToActOn?.id) return;
    const id = this.subjectToActOn.id;
    const isDelete = this.confirmMode === 'delete';

    this.confirming = true;
    this.cdr.markForCheck();

    const call$ = isDelete
      ? this.subjectService.deleteSubject(id)
      : this.subjectService.restoreSubject(id);

    call$.subscribe({
      next: (res: any) => {
        this.confirming = false;
        this.showConfirm = false;
        this.subjectToActOn = null;

        this.popupType = 'success';
        this.popupMessage = res?.message || (isDelete ? 'Subject deleted successfully' : 'Subject restored successfully');
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();

        this.loadSubjects();
      },
      error: (err: any) => {
        this.confirming = false;
        this.showConfirm = false;
        this.subjectToActOn = null;

        this.popupType = 'error';
        this.popupMessage = err?.error?.message || (isDelete ? 'Failed to delete subject.' : 'Failed to restore subject.');
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();
      }
    });
  }

  onToggleIncludeDeleted(): void {
    this.filter.page = 0;
    this.loadSubjects();
  }

  // ✅ replaced — form submit pe bhi toast
  onSubmit(): void {
    if (!this.formModel.subjectName || !this.formModel.subjectCode) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    this.subjectService.addOrUpdateSubject(this.formModel).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.isSidebarOpen = false;

        this.popupType = 'success';
        this.popupMessage = res?.message || (this.formModel.id ? 'Subject updated successfully!' : 'Subject added successfully!');
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();

        this.loadSubjects();
      },
      error: (err: any) => {
        this.isSaving = false;

        this.popupType = 'error';
        this.popupMessage = err?.error?.message || 'Failed to save subject. Please try again.';
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
    this.showResultPopup = false;
    this.cdr.markForCheck();
  }

  get safeSubjects(): SubjectResponseDto[] { return this.subjects ?? []; }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get currentPage(): number { return this.filter.page; }

  trackById(_: number, item: SubjectResponseDto): string {
    return item.id ?? '';
  }
}