import {
  Component, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ← Router import kiya
import {
  ClassTeacherAssignmentFilterRequest,
  ClassTeacherAssignmentResponseDto,
  PagedResponse
} from '../../models/teacher.model';
import { TeacherService, ParamDropdownOption } from '../../services/teacher.service';

@Component({
  selector: 'app-class-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-teacher-list.component.html',
  styleUrls: ['./class-teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassTeacherListComponent implements OnInit {
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

  constructor(
    private teacherService: TeacherService,
    private router: Router, // ← Inject router reference
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
    this.loadClassOptions();
    this.loadSessionOptions();
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

  onClassChange(): void {
    // Class badalte hi purana section selection aur options clear
    this.filterSectionId = '';
    this.sectionOptions = [];

    if (this.filterClassId) {
      this.isLoadingSections = true;
      this.teacherService.getSectionOptions(this.filterClassId).subscribe({
        next: (opts) => {
          this.sectionOptions = opts;
          this.isLoadingSections = false;
          this.cdr.markForCheck();
        },
        error: () => { this.isLoadingSections = false; this.cdr.markForCheck(); }
      });
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
    // teacher.routes.ts ke static route parameter ke mutabik jump trigger kiya
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
    this.loadAssignments();
  }

  changePage(p: number): void {
    this.filter.page = p;
    this.loadAssignments();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}