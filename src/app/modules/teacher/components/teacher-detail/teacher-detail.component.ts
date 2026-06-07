import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherStateService } from '../../services/teacher.service';
import { TeacherResponseDto } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-detail.component.html',
  styleUrls: ['./teacher-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDetailComponent implements OnInit {
  teacher: TeacherResponseDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherState: TeacherStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.teacher = this.teacherState.get();
    if (!this.teacher) { this.router.navigate(['teachers', 'list']); return; }
    this.cdr.markForCheck();
  }

  onEdit(): void {
    if (this.teacher) {
      this.teacherState.set(this.teacher);
      this.router.navigate(['teachers', 'edit', this.teacher.teacherId ?? this.teacher.id]);
    }
  }

  onBack(): void { this.router.navigate(['teachers', 'list']); }

  formatDate(d?: string): string {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  }

  initials(): string {
    if (!this.teacher) return '';
    return (this.teacher.firstName?.charAt(0) ?? '') + (this.teacher.lastName?.charAt(0) ?? '');
  }
}
