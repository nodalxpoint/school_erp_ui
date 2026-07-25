import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SchoolService } from '../services/school.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { PlatformStudentSummary, PlatformTeacherSummary, SchoolFeature } from '../models/school.model';

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
  activeTab: 'students' | 'teachers' | 'features' = 'students';

  students: PlatformStudentSummary[] = [];
  teachers: PlatformTeacherSummary[] = [];
  isLoading = false;

  features: SchoolFeature[] = [];
  featuresLoading = false;
  featuresSaving = false;
  pendingChanges: Record<string, boolean> = {};

  impersonateEmail = '';
  isImpersonating = false;
  impersonateError: string | null = null;
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private schoolService: SchoolService,
    private authService: AuthService,
    private authState: AuthStateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.canEdit = this.authState.canEditAsPlatformAdmin;
  }

  ngOnInit(): void {
    this.schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadStudents();
  }

  setTab(tab: 'students' | 'teachers' | 'features'): void {
    this.activeTab = tab;
    if (tab === 'students' && this.students.length === 0) this.loadStudents();
    if (tab === 'teachers' && this.teachers.length === 0) this.loadTeachers();
    if (tab === 'features' && this.features.length === 0) this.loadFeatures();
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

  loadFeatures(): void {
    this.featuresLoading = true;
    this.schoolService.getSchoolFeatures(this.schoolId).subscribe({
      next: (data) => {
        this.features = data;
        this.pendingChanges = {};
        this.featuresLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.featuresLoading = false; this.cdr.markForCheck(); },
    });
  }

  onFeatureToggle(feature: SchoolFeature, checked: boolean): void {
    if (checked === feature.enabled) {
      delete this.pendingChanges[feature.key];
    } else {
      this.pendingChanges[feature.key] = checked;
    }
  }

  get hasPendingFeatureChanges(): boolean {
    return Object.keys(this.pendingChanges).length > 0;
  }

  isPending(feature: SchoolFeature): boolean {
    return this.pendingChanges[feature.key] !== undefined;
  }

  effectiveEnabled(feature: SchoolFeature): boolean {
    return this.pendingChanges[feature.key] ?? feature.enabled;
  }

  saveFeatures(): void {
    if (!this.hasPendingFeatureChanges) return;
    this.featuresSaving = true;
    this.schoolService.updateSchoolFeatures(this.schoolId, this.pendingChanges).subscribe({
      next: (data) => {
        this.features = data;
        this.pendingChanges = {};
        this.featuresSaving = false;
        this.cdr.markForCheck();
      },
      error: () => { this.featuresSaving = false; this.cdr.markForCheck(); },
    });
  }

  discardFeatureChanges(): void {
    this.pendingChanges = {};
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
