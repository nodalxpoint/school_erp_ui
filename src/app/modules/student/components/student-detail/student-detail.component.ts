import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentResponseDto } from '../../models/student.model';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetailComponent implements OnInit {
  student: StudentResponseDto | null = null;
  studentId: string | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id');

    if (!this.studentId) {
      this.router.navigate(['students', 'list']);
      return;
    }

    this.loadStudent(this.studentId);
  }

  loadStudent(id: string): void {
    this.loading = true;
    this.error = '';
    this.studentService.getStudentById(id).subscribe({
      next: (data) => {
        this.student = data;
        this.loading = false;
        if (!data) this.error = 'Student not found.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load student details. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onEdit(): void {
    if (this.student) {
      this.router.navigate(['students', 'edit', this.student.id]);
    }
  }

  onBack(): void {
    this.router.navigate(['students', 'list']);
  }

  formatGender(g?: string): string {
    if (g === 'MALE') return 'Male';
    if (g === 'FEMALE') return 'Female';
    if (g === 'OTHER') return 'Other';
    return '—';
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  }
}