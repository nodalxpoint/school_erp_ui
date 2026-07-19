import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { TeacherListStateService } from '../../services/teacher-list-state.service';
import { TeacherResponseDto, TeacherFilterRequest } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherListComponent implements OnInit {
  teachers: TeacherResponseDto[] = [];
  isLoading = false;
  totalElements = 0;
  totalPages = 0;

  filter: TeacherFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'asc'
  };
  searchText = '';

  // Delete confirm popup
  showDeleteConfirm = false;
  teacherToDelete: TeacherResponseDto | null = null;
  deleting = false;

  // Result toast
  showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

  // Action menu (3-dot dropdown)
  openMenuId: string | null = null;

  constructor(
    private teacherService: TeacherService,
    private listState: TeacherListStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadTeachers();
  }

  // ── State persistence ────────────────────────────────────────

  private restoreState(): void {
    const saved = this.listState.get();
    if (!saved) return;
    this.searchText = saved.searchText;
    this.filter.page = saved.page;
  }

  private persistState(): void {
    this.listState.save({
      searchText: this.searchText,
      page: this.filter.page,
    });
  }

  // Close any open action-menu when clicking anywhere else on the page
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openMenuId !== null) {
      this.openMenuId = null;
      this.cdr.markForCheck();
    }
  }

  toggleActionMenu(id: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!id) return;
    this.openMenuId = this.openMenuId === id ? null : id;
    this.cdr.markForCheck();
  }

  closeActionMenu(): void {
    this.openMenuId = null;
    this.cdr.markForCheck();
  }

  loadTeachers(): void {
    this.isLoading = true;
    this.teacherService.filterTeachers({
      ...this.filter,
      firstName: this.searchText || undefined
    }).subscribe({
      next: (res: any) => {
        this.teachers = res?.data ?? [];
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
    this.persistState();
    this.loadTeachers();
  }

  onPageChange(p: number): void {
    this.filter.page = p;
    this.persistState();
    this.loadTeachers();
  }

  onView(t: TeacherResponseDto): void {
    this.closeActionMenu();
    this.router.navigate([`/teachers/${t.teacherId}`], {
      state: { teacher: t }
    });
  }

  onAddTeacher(): void {
    this.router.navigate(['/teachers/add']);
  }

  onEdit(t: TeacherResponseDto): void {
    this.closeActionMenu();
    this.router.navigate(['/teachers', t.teacherId, 'edit'], {
      state: { teacher: t }
    });
  }

  onDelete(t: TeacherResponseDto): void {
    const id = t.id ?? t.teacherId;
    if (!id) return;
    this.closeActionMenu();
    this.teacherToDelete = t;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.teacherToDelete = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (this.deleting) return;
    const id = this.teacherToDelete?.id ?? this.teacherToDelete?.teacherId;
    if (!id) return;

    this.deleting = true;
    this.cdr.markForCheck();

    this.teacherService.deleteTeacher(id).subscribe({
      next: (res: any) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.teacherToDelete = null;

        this.popupType = 'success';
        this.popupMessage = res?.message || 'Teacher deleted successfully';
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();

        this.loadTeachers();
      },
      error: (err: any) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.teacherToDelete = null;

        this.popupType = 'error';
        this.popupMessage = err?.error?.message || 'Failed to delete teacher.';
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

  get safeTeachers(): TeacherResponseDto[] { return this.teachers ?? []; }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get currentPage(): number { return this.filter.page; }

  teacherName(t: TeacherResponseDto): string {
    return t.lastName ? `${t.firstName} ${t.lastName}` : t.firstName;
  }

  initials(t: TeacherResponseDto): string {
    const f = t.firstName?.[0] ?? '';
    const l = t.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  trackById(_: number, t: TeacherResponseDto): string {
    return t.id ?? t.teacherId ?? '';
  }

  // Stable row id used to key the open action-menu (id or teacherId)
  rowId(t: TeacherResponseDto): string {
    return t.id ?? t.teacherId ?? '';
  }
}