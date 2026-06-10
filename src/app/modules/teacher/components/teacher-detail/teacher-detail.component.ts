import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherResponseDto } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-detail.component.html',
  styleUrls: ['./teacher-detail.component.scss']
})
export class TeacherDetailComponent {
  @Input() teacher: TeacherResponseDto | null = null;
  @Output() edit  = new EventEmitter<TeacherResponseDto>();
  @Output() close = new EventEmitter<void>();

  get fullName(): string {
    if (!this.teacher) return '';
    return this.teacher.lastName
      ? `${this.teacher.firstName} ${this.teacher.lastName}`
      : this.teacher.firstName;
  }

  get initials(): string {
    if (!this.teacher) return '';
    const f = this.teacher.firstName?.[0] ?? '';
    const l = this.teacher.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }
}