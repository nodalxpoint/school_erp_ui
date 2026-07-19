import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { StudentService, StudentStateService } from '../../services/student.service';
import { StudentListStateService } from '../../services/student-list-state.service';
import { StudentResponseDto, StudentFilterRequest, DropdownOption } from '../../models/student.model';
import { StudentUdiseModalComponent } from '../student-udise-modal/student-udise-modal.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentUdiseModalComponent],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentListComponent implements OnInit, OnDestroy {
  students: StudentResponseDto[] = [];
  loading = false;
  error = '';

  // Filters
  searchFirstName = '';
  searchLastName = '';
  searchAdmissionNo = '';
  selectedClassId = '';
  selectedSectionId = '';
  selectedAcademicSessionId = '';

  // Dropdowns
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  academicSessions: DropdownOption[] = [];
  loadingClasses = false;
  loadingSections = false;
  loadingSessions = false;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // UDISE compliance modal
  selectedStudentForUdise: StudentResponseDto | null = null;
  showUdiseModal = false;

  // Delete confirm + toast
  showDeleteConfirm = false;
  studentToDelete: StudentResponseDto | null = null;
  deleting = false;

  showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

  // Action menu (3-dot dropdown)
  openMenuId: string | null = null;

  // Search debouncing + cleanup
  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private studentService: StudentService,
    private studentState: StudentStateService,
    private listState: StudentListStateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadAcademicSessions();
    this.loadClasses();

    // If a class filter was restored, its sections need to be loaded too
    if (this.selectedClassId) {
      this.loadSections(this.selectedClassId);
    }

    this.loadStudents();

    // Debounce the name search: waits 400ms after the user stops typing,
    // and skips the call entirely if the value hasn't actually changed.
    this.searchInput$
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.onSearch());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── State persistence ────────────────────────────────────────

  private restoreState(): void {
    const saved = this.listState.get();
    if (!saved) return;

    this.searchFirstName = saved.searchFirstName;
    this.selectedClassId = saved.selectedClassId;
    this.selectedSectionId = saved.selectedSectionId;
    this.selectedAcademicSessionId = saved.selectedAcademicSessionId;
    this.currentPage = saved.currentPage;
  }

  private persistState(): void {
    this.listState.save({
      searchFirstName: this.searchFirstName,
      selectedClassId: this.selectedClassId,
      selectedSectionId: this.selectedSectionId,
      selectedAcademicSessionId: this.selectedAcademicSessionId,
      currentPage: this.currentPage,
    });
  }

  // Called from the name filter input (input) event, instead of onSearch()
  // directly — this only pushes into the debounced stream.
  onNameFilterChange(): void {
    this.searchInput$.next(this.searchFirstName);
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

  // ── Dropdowns ──────────────────────────────────────────────────

  loadAcademicSessions(): void {
    this.loadingSessions = true;
    this.studentService.getAcademicSessions().subscribe({
      next: (data) => {
        this.academicSessions = data;
        this.loadingSessions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSessions = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadClasses(): void {
    this.loadingClasses = true;
    this.studentService.getClasses().subscribe({
      next: (data) => { this.classes = data; this.loadingClasses = false; this.cdr.markForCheck(); },
      error: ()     => { this.loadingClasses = false; this.cdr.markForCheck(); },
    });
  }

  private loadSections(classId: string): void {
    this.loadingSections = true;
    this.studentService.getSections(classId).subscribe({
      next: (data) => { this.sections = data; this.loadingSections = false; this.cdr.markForCheck(); },
      error: ()     => { this.loadingSections = false; this.cdr.markForCheck(); },
    });
  }

  onClassFilterChange(): void {
    this.selectedSectionId = '';
    this.sections = [];
    if (this.selectedClassId) {
      this.loadSections(this.selectedClassId);
    }
    this.onSearch();
  }

  // ── Students ───────────────────────────────────────────────────

  loadStudents(): void {
    this.loading = true;
    this.error = '';

    const req: StudentFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'firstName',
      sortDirection: 'ASC',
      firstName:   this.searchFirstName.trim()   || undefined,
      lastName:    this.searchLastName.trim()     || undefined,
      admissionNo: this.searchAdmissionNo.trim()  || undefined,
      classId:     this.selectedClassId           || undefined,
      sectionId:   this.selectedSectionId         || undefined,
      academicSessionId: this.selectedAcademicSessionId || undefined,
    };

    this.studentService.filterStudents(req).subscribe({
      next: (res) => {
        this.students      = res.data;
        this.totalElements = res.totalElements;
        this.totalPages    = res.totalPages;
        this.loading       = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error   = 'Failed to load students. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.persistState();
    this.loadStudents();
  }

  clearFilters(): void {
    this.searchFirstName  = '';
    this.searchLastName   = '';
    this.searchAdmissionNo = '';
    this.selectedClassId  = '';
    this.selectedSectionId = '';
    this.selectedAcademicSessionId = '';
    this.sections          = [];
    this.currentPage       = 0;
    this.listState.clear();
    this.loadStudents();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchFirstName || this.searchLastName ||
              this.searchAdmissionNo || this.selectedClassId || this.selectedSectionId || this.selectedAcademicSessionId);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.persistState();
    this.loadStudents();
  }

  // ── Navigation ─────────────────────────────────────────────────

  onAddStudent(): void {
    this.studentState.clear();
    this.router.navigate(['students', 'add']);
  }

  onEditStudent(student: any) {
    this.closeActionMenu();
    this.router.navigate(['/students/edit', student.id]);
  }

  onViewStudent(student: any) {
    this.closeActionMenu();
    this.router.navigate(['/students/detail', student.id]);
  }

  onDeleteStudent(student: StudentResponseDto): void {
    if (!student.id) return;
    this.closeActionMenu();
    this.studentToDelete = student;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.studentToDelete = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (this.deleting) return;
    if (!this.studentToDelete?.id) return;
    const id = this.studentToDelete.id;

    this.deleting = true;
    this.cdr.markForCheck();

    this.studentService.deleteStudent(id).subscribe({
      next: (res: any) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.studentToDelete = null;

        this.popupType = 'success';
        this.popupMessage = res?.message || 'Student deleted successfully';
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();

        this.loadStudents();
      },
      error: (err: any) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.studentToDelete = null;

        this.popupType = 'error';
        this.popupMessage = err?.error?.message || 'Failed to delete student.';
        this.showResultPopup = true;
        this.cdr.markForCheck();
        this.startPopupTimer();
      },
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

  onOpenUdise(student: StudentResponseDto): void {
    this.selectedStudentForUdise = student;
    this.showUdiseModal = true;
    this.cdr.markForCheck();
  }

  onCloseUdise(): void {
    this.selectedStudentForUdise = null;
    this.showUdiseModal = false;
    this.cdr.markForCheck();
  }

  // ── Pagination helpers ─────────────────────────────────────────

  get pages(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    let start   = Math.max(0, cur - 2);
    let end     = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(total - 1, 4);
      else             start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startIndex(): number { return this.currentPage * this.pageSize + 1; }
  get endIndex(): number   { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }
}