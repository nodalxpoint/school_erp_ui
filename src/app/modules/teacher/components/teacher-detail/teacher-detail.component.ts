import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service'; // ✅ Dynamic ref if refresh occurs
import { TeacherResponseDto } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-detail.component.html',
  styleUrls: ['./teacher-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherDetailComponent implements OnInit {
  teacher: TeacherResponseDto | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // A. Capture full object straight from historical navigation routing state
    const stateData = history.state?.['teacher'];
    if (stateData) {
      this.teacher = stateData;
      this.cdr.markForCheck();
    } else {
      // B. Fallback: If page reloaded, fetch it dynamically from base database registry
      const teacherId = this.route.snapshot.paramMap.get('id');
      if (teacherId) {
        this.isLoading = true;
        this.teacherService.filterTeachers({ page: 0, size: 200 }).subscribe({
          next: (res: any) => {
            this.teacher = res?.data?.find((t: any) => t.teacherId === teacherId) || null;
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => { this.isLoading = false; this.cdr.markForCheck(); }
        });
      }
    }
  }

  get fullName(): string {
    if (!this.teacher) return '';
    return this.teacher.lastName ? `${this.teacher.firstName} ${this.teacher.lastName}` : this.teacher.firstName;
  }

  get initials(): string {
    if (!this.teacher) return '';
    const f = this.teacher.firstName?.[0] ?? '';
    const l = this.teacher.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  onGoBack(): void {
    this.router.navigate(['/teachers']);
  }

  onEditTeacher(): void {
    if (!this.teacher) return;
    this.router.navigate(['/teachers', this.teacher.teacherId, 'edit'], {
      state: { teacher: this.teacher }
    });
  }
}