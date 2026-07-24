import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  ClassTeacherAssignmentFilterRequest,
  ClassTeacherAssignmentResponseDto,
  PagedResponse
} from '../../models/teacher.model';
import { TeacherService, ParamDropdownOption } from '../../services/teacher.service';
import { ClassTeacherListStateService } from '../../services/class-teacher-list-state.service';

@Component({
  selector: 'app-class-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-teacher-list.component.html',
  styleUrls: ['./class-teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassTeacherListComponent implements OnInit, OnDestroy {
  assignments: ClassTeacherAssignmentResponseDto[] = [];
  isLoadingList = false;
  totalPages    = 0;
  totalElements = 0;

  filter: ClassTeacherAssignmentFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'desc'
  };
  filterTeacherName = '';

  // ── Class / Section filter (param/list se) ──────────────────────────────
  classOptions: ParamDropdownOption[] = [];
  sectionOptions: ParamDropdownOption[] = [];
  sessionOptions: ParamDropdownOption[] = [];
  filterClassId = '';
  filterSectionId = '';
  filterAcademicSessionId = '';
  isLoadingSections = false;

  // Debounced name search + cleanup
  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private teacherService: TeacherService,
    private listState: ClassTeacherListStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadClassOptions();
    this.loadSessionOptions();

    // If a class filter was restored, its sections need to be loaded too
    if (this.filterClassId) {
      this.loadSections(this.filterClassId);
    }

    this.loadAssignments();

    // Debounce the teacher-name search: waits 400ms after the user stops
    // typing, and skips the call if the value hasn't actually changed.
    this.searchInput$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.applyFilter());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── State persistence ────────────────────────────────────────

  private restoreState(): void {
    const saved = this.listState.get();
    if (!saved) return;

    this.filterTeacherName = saved.filterTeacherName;
    this.filterClassId = saved.filterClassId;
    this.filterSectionId = saved.filterSectionId;
    this.filterAcademicSessionId = saved.filterAcademicSessionId;
    this.filter.page = saved.page;
  }

  private persistState(): void {
    this.listState.save({
      filterTeacherName: this.filterTeacherName,
      filterClassId: this.filterClassId,
      filterSectionId: this.filterSectionId,
      filterAcademicSessionId: this.filterAcademicSessionId,
      page: this.filter.page,
    });
  }

  // Called from the name filter input's (input) event — pushes into the
  // debounced stream instead of searching on every keystroke.
  onTeacherNameInput(): void {
    this.searchInput$.next(this.filterTeacherName);
  }

  // ── Class / Section dropdown loaders ─────────────────────────────────────

  loadClassOptions(): void {
    this.teacherService.getClassOptions().subscribe({
      next: (opts) => { this.classOptions = opts; this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  loadSessionOptions(): void {
    this.teacherService.getAcademicSessionOptions().subscribe({
      next: (opts) => { this.sessionOptions = opts; this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  private loadSections(classId: string): void {
    this.isLoadingSections = true;
    this.teacherService.getSectionOptions(classId).subscribe({
      next: (opts) => {
        this.sectionOptions = opts;
        this.isLoadingSections = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingSections = false; this.cdr.markForCheck(); }
    });
  }

  onClassChange(): void {
    // Class badalte hi purana section selection aur options clear
    this.filterSectionId = '';
    this.sectionOptions = [];

    if (this.filterClassId) {
      this.loadSections(this.filterClassId);
    }

    this.applyFilter();
  }

  onSectionChange(): void {
    this.applyFilter();
  }

  // ── Loader ─────────────────────────────────────────────────────────────────

  loadAssignments(): void {
    this.isLoadingList = true;
    this.teacherService.filterClassTeacherAssignments({
      ...this.filter,
      teacherName: this.filterTeacherName || undefined
    }).subscribe({
      next: (res: PagedResponse<ClassTeacherAssignmentResponseDto>) => {
        this.assignments   = res.data;
        this.totalPages    = res.totalPages;
        this.totalElements = res.totalElements;
        this.isLoadingList = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingList = false; this.cdr.markForCheck(); }
    });
  }

  // ── Navigation Hook ──
  onAssignTeacherRoute(): void {
    this.router.navigate(['/teachers/assign']);
  }

  onEdit(assignment: ClassTeacherAssignmentResponseDto): void {
    this.router.navigate(['/teachers/assign'], { state: { assignment } });
  }

  // ── Pagination & Filter ───────────────────────────────────────────────────

  applyFilter(): void {
    this.filter.page = 0;
    this.filter.classId = this.filterClassId || undefined;
    this.filter.sectionId = this.filterSectionId || undefined;
    this.filter.academicSessionId = this.filterAcademicSessionId || undefined;
    this.persistState();
    this.loadAssignments();
  }

  clearFilters(): void {
    this.filterTeacherName = '';
    this.filterClassId = '';
    this.filterSectionId = '';
    this.filterAcademicSessionId = '';
    this.sectionOptions = [];
    this.filter.page = 0;
    this.filter.classId = undefined;
    this.filter.sectionId = undefined;
    this.filter.academicSessionId = undefined;
    this.listState.clear();
    this.loadAssignments();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterTeacherName || this.filterClassId ||
              this.filterSectionId || this.filterAcademicSessionId);
  }

  changePage(p: number): void {
    this.filter.page = p;
    this.persistState();
    this.loadAssignments();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}