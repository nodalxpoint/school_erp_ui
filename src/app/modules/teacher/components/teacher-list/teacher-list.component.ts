import {
  Component, EventEmitter, Input, Output, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherResponseDto } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherListComponent {
  @Input() teachers: TeacherResponseDto[] = [];
  @Input() isLoading = false;
  @Input() totalElements = 0;
  @Input() totalPages = 0;
  @Input() currentPage = 0;

  // Safety: ensure teachers is never undefined/null
  get safeTeachers(): TeacherResponseDto[] {
    return this.teachers ?? [];
  }

  @Output() editTeacher   = new EventEmitter<TeacherResponseDto>();
  @Output() pageChange    = new EventEmitter<number>();

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  teacherName(t: TeacherResponseDto): string {
    return t.lastName ? `${t.firstName} ${t.lastName}` : t.firstName;
  }

  initials(t: TeacherResponseDto): string {
    const f = t.firstName?.[0] ?? '';
    const l = t.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

trackById(_: number, t: TeacherResponseDto): string { return t.id ?? t.teacherId ?? ''; }


}