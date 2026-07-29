import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { HttpService } from '../../../../core/services/http.service';
import { StudentService } from '../../../student/services/student.service';
import { DropdownOption } from '../../../student/models/student.model';
import { FeeService } from '../../../fee/services/fee.service';
import { ParentService } from '../../../parent/services/parent.service';
import { ChildStudentDto } from '../../../parent/models/parent.model';
import { NoticeService } from '../../service/notice.service';
import { NoticeDto } from '../../models/notice.model';

type NoticeTab = 'school' | 'class';

@Component({
  selector: 'app-notice-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notice-board.component.html',
  styleUrls: ['./notice-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoticeBoardComponent implements OnInit {
  notices: NoticeDto[] = [];
  isLoading = false;
  totalElements = 0;
  page = 0;
  size = 10;

  // teacher ke liye class-section context (class notice tab ke liye)
  myClassId: string | null = null;
  mySectionId: string | null = null;
  isLoadingMyClass = false;

  // admin ke liye manual filter (StudentService pattern)
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  selectedClassId = '';
  selectedSectionId = '';
  loadingClasses = false;
  loadingSections = false;

  // admin + parent — academic session filter (FeeService.getParams pattern)
  academicSessions: DropdownOption[] = [];
  selectedSessionId = '';
  loadingSessions = false;

  // parent — select child filter
  childrenList: ChildStudentDto[] = [];
  selectedChildId = '';
  selectedChildObj: ChildStudentDto | null = null;
  loadingChildren = false;

  // teacher/parent — School Notice vs Class Notice tab
  activeTab: NoticeTab = 'class';

  toast: { type: 'success' | 'error'; message: string } | null = null;
  private toastTimeoutId: any = null;

  constructor(
    public authState: AuthStateService,
    private noticeService: NoticeService,
    private http: HttpService,
    private studentService: StudentService,
    private feeService: FeeService,
    private parentService: ParentService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isTeacher) {
      this.loadMyClassThenNotices();
    } else if (this.isParent) {
      this.loadAcademicSessions();
      this.loadChildrenForParent();
    } else if (this.isAdmin) {
      this.loadAcademicSessions();
      this.loadClasses();
      this.loadNotices();
    } else {
      this.loadNotices();
    }
  }

  get currentUser() { return this.authState.currentUser; }
  get isAdmin(): boolean {
    const r = this.currentUser?.role;
    return r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'SCHOOL_ADMIN';
  }
  get isTeacher(): boolean { return this.currentUser?.role === 'TEACHER'; }
  get isParent(): boolean { return this.currentUser?.role === 'PARENT'; }
  get canCreate(): boolean { return this.isAdmin || this.isTeacher; }
  get hasActiveFilter(): boolean { return !!this.selectedClassId || !!this.selectedSectionId || !!this.selectedSessionId; }

  // ── Tabs (Teacher / Parent) ───────────────────────────────────────

  switchTab(tab: NoticeTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.page = 0;
    this.loadNotices();
  }

  private loadMyClassThenNotices(): void {
    this.isLoadingMyClass = true;
    this.http.get<any>('/teacher/myClass')
      .pipe(catchError(err => { console.error('myClass load failed:', err); return of(null); }))
      .subscribe(res => {
        this.isLoadingMyClass = false;
        if (res?.success && res.data) {
          this.myClassId = res.data.classId;
          this.mySectionId = res.data.sectionId;
        }
        this.loadNotices();
      });
  }

  // ── Parent: children + academic sessions ──────────────────────────

  private loadChildrenForParent(): void {
    this.loadingChildren = true;
    this.parentService.getChildrenRegistry().subscribe({
      next: (children) => {
        this.childrenList = children;
        if (children.length > 0) {
          const cached = this.parentService.getActiveChildValue();
          if (cached && children.some(c => c.id === cached.id)) {
            this.selectedChildId = cached.id;
            this.selectedChildObj = cached;
          } else {
            this.selectedChildId = children[0].id;
            this.selectedChildObj = children[0];
            this.parentService.setActiveChild(children[0]);
          }
          if (!this.selectedSessionId && this.selectedChildObj?.academicSessionId) {
            this.selectedSessionId = this.selectedChildObj.academicSessionId;
          }
        }
        this.loadingChildren = false;
        this.cdr.markForCheck();
        this.loadNotices();
      },
      error: () => { this.loadingChildren = false; this.cdr.markForCheck(); this.loadNotices(); }
    });
  }

  onChildFilterChange(): void {
    this.selectedChildObj = this.childrenList.find(c => c.id === this.selectedChildId) || null;
    if (this.selectedChildObj) {
      this.parentService.setActiveChild(this.selectedChildObj);
    }
    this.page = 0;
    this.loadNotices();
  }

  // ── Academic Session (Admin + Parent) ──────────────────────────────

  loadAcademicSessions(): void {
    this.loadingSessions = true;
    this.feeService.getParams('academic_sessions').subscribe({
      next: (data) => {
        this.academicSessions = data;
        if (!this.selectedSessionId && data.length > 0 && this.isAdmin) {
          // admin ke liye default select nahi karte, "All Sessions" hi default rahega
        }
        this.loadingSessions = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingSessions = false; this.cdr.markForCheck(); }
    });
  }

  onSessionFilterChange(): void {
    this.page = 0;
    this.loadNotices();
  }

  // ── Dropdowns (Admin — StudentService pattern) ─────────────────────

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
    this.page = 0;
    if (this.selectedClassId) {
      this.loadSections(this.selectedClassId);
    }
    this.loadNotices();
  }

  onSectionFilterChange(): void {
    this.page = 0;
    this.loadNotices();
  }

  clearFilters(): void {
    this.selectedClassId = '';
    this.selectedSectionId = '';
    this.selectedSessionId = '';
    this.sections = [];
    this.page = 0;
    this.loadNotices();
  }

  // ── Notices ──────────────────────────────────────────────────────

  loadNotices(): void {
    this.isLoading = true;
    const request: any = {
      page: this.page, size: this.size, sortBy: 'publishDate', sortDirection: 'DESC'
    };

    if (this.isAdmin) {
      if (this.selectedSessionId) request.academicSessionId = this.selectedSessionId;
      if (this.selectedClassId) request.classId = this.selectedClassId;
      if (this.selectedSectionId) request.sectionId = this.selectedSectionId;
    } else if (this.isTeacher) {
      if (this.activeTab === 'school') {
        request.targetType = 'ALL';
      } else {
        if (this.myClassId) request.classId = this.myClassId;
        if (this.mySectionId) request.sectionId = this.mySectionId;
      }
    } else if (this.isParent) {
      if (this.activeTab === 'school') {
        request.targetType = 'ALL';
      } else if (this.selectedChildObj) {
        request.classId = this.selectedChildObj.classId;
        request.sectionId = this.selectedChildObj.sectionId;
      }
    }

    this.noticeService.filterNotices(request)
      .pipe(catchError(err => { console.error('Notice list load failed:', err); return of(null); }))
      .subscribe(res => {
        this.isLoading = false;
        if (res) {
          this.notices = res.data ?? [];
          this.totalElements = res.totalElements ?? 0;
        }
        this.cdr.markForCheck();
      });
  }

  openCreatePage(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  openEditPage(n: NoticeDto): void {
    this.router.navigate(['edit', n.id], { relativeTo: this.route, state: { notice: n } });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.loadNotices();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.size));
  }

  getStatus(n: NoticeDto): 'upcoming' | 'active' | 'expired' {
    const today = new Date().toISOString().slice(0, 10);
    if (today < n.publishDate) return 'upcoming';
    if (today > n.expiryDate) return 'expired';
    return 'active';
  }
}