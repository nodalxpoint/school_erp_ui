import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentStateService } from '../../services/student.service';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentState: StudentStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id');
    this.student = this.studentState.get();

    if (!this.student) {
      // State clear ho gayi (page refresh) — list pe wapas jaao
      this.router.navigate(['students', 'list']);
      return;
    }
    this.cdr.markForCheck();
  }

  onEdit(): void {
    if (this.student) {
      this.studentState.set(this.student);
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
