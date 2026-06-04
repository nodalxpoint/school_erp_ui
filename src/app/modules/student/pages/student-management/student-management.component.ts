import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentListComponent } from '../../components/student-list/student-list.component';
import { StudentFormComponent } from '../../components/student-form/student-form.component';
import { StudentResponseDto } from '../../models/student.model';

type Tab = 'list' | 'form';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, StudentListComponent, StudentFormComponent],
  templateUrl: './student-management.component.html',
  styleUrls: ['./student-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentManagementComponent {
  @ViewChild(StudentListComponent) listComponent?: StudentListComponent;

  activeTab: Tab = 'list';
  studentToEdit: StudentResponseDto | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'list') {
      this.studentToEdit = null;
    }
    this.cdr.markForCheck();
  }

  onAddStudent(): void {
    this.studentToEdit = null;
    this.activeTab = 'form';
    this.cdr.markForCheck();
  }

  onEditStudent(student: StudentResponseDto): void {
    this.studentToEdit = student;
    this.activeTab = 'form';
    this.cdr.markForCheck();
  }

  onStudentSaved(): void {
    this.activeTab = 'list';
    this.studentToEdit = null;
    this.cdr.markForCheck();
    // Refresh list after save
    setTimeout(() => {
      this.listComponent?.loadStudents();
    }, 100);
  }

  onFormCancelled(): void {
    this.activeTab = 'list';
    this.studentToEdit = null;
    this.cdr.markForCheck();
  }
}