import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SchoolService } from '../services/school.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PlatformStudentSummary, PlatformTeacherSummary } from '../models/school.model';

@Component({
  selector: 'app-school-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './school-dashboard.component.html',
  styleUrls: ['./school-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDashboardComponent implements OnInit {
  schoolId = '';
  activeTab: 'students' | 'teachers' = 'students';

  students: PlatformStudentSummary[] = [];
  teachers: PlatformTeacherSummary[] = [];
  isLoading = false;

  impersonateEmail = '';
  isImpersonating = false;
  impersonateError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private schoolService: SchoolService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadStudents();
  }

  setTab(tab: 'students' | 'teachers'): void {
    this.activeTab = tab;
    if (tab === 'students' && this.students.length === 0) this.loadStudents();
    if (tab === 'teachers' && this.teachers.length === 0) this.loadTeachers();
    this.cdr.markForCheck();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.schoolService.getSchoolStudents(this.schoolId).subscribe({
      next: (res) => {
        this.students = res.data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); },
    });
  }

  loadTeachers(): void {
    this.isLoading = true;
    this.schoolService.getSchoolTeachers(this.schoolId).subscribe({
      next: (res) => {
        this.teachers = res.data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); },
    });
  }

  impersonate(): void {
    if (!this.impersonateEmail.trim()) return;
    this.isImpersonating = true;
    this.impersonateError = null;

    this.authService.impersonate(this.impersonateEmail.trim()).subscribe({
      next: () => {
        this.isImpersonating = false;
        // AuthService already navigates to /dashboard as the impersonated user.
      },
      error: (err: HttpErrorResponse) => {
        this.isImpersonating = false;
        this.impersonateError = err.error?.message ?? 'Failed to impersonate this user.';
        this.cdr.markForCheck();
      },
    });
  }

  back(): void {
    this.router.navigate(['/schools']);
  }
}
