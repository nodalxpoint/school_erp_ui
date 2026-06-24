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
import { TeacherService } from '../../services/teacher.service';

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

  constructor(
    private teacherService: TeacherService,
    private router: Router, // ← Inject router reference
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
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

  // ── Pagination & Filter ───────────────────────────────────────────────────

  applyFilter(): void {
    this.filter.page = 0;
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