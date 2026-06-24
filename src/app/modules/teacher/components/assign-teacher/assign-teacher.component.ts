import {
  Component, EventEmitter, Input, OnInit,
  Output, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import {
  AssignClassTeacherDto,
  AssignTeacherFormState,
} from '../../models/teacher.model';
import { TeacherService, ParamDropdownOption } from '../../services/teacher.service';

@Component({
  selector: 'app-assign-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-teacher.component.html',
  styleUrls: ['./assign-teacher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignTeacherComponent implements OnInit {
  @Input() schoolId: string = '';
  @Output() assigned = new EventEmitter<void>();

  classes:          ParamDropdownOption[] = [];
  sections:         ParamDropdownOption[] = [];   
  teachers:         ParamDropdownOption[] = [];   
  academicSessions: ParamDropdownOption[] = [];   

  loadingClasses  = false;
  loadingSections = false;
  loadingTeachers = false;
  loadingSessions = false;

  form: AssignTeacherFormState = {
    classId: '', sectionId: '', teacherId: '', academicSessionId: ''
  };
  errors: Record<string, string> = {};
  isSubmitting = false;

  constructor(
    private teacherService: TeacherService,
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loadingClasses = true;
    this.teacherService.getClassOptions().subscribe({
      next: data => {
        this.classes        = data;
        this.loadingClasses = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClasses = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadSections(classId: string): void {
    this.loadingSections = true;
    this.sections        = [];
    this.teacherService.getSectionOptions(classId).subscribe({
      next: data => {
        this.sections        = data;
        this.loadingSections = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSections = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTeachers(): void {
    this.loadingTeachers = true;
    this.teachers        = [];
    this.teacherService.getTeacherOptions().subscribe({
      next: data => {
        this.teachers        = data;
        this.loadingTeachers = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingTeachers = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAcademicSessions(): void {
    this.loadingSessions  = true;
    this.academicSessions = [];
    this.teacherService.getAcademicSessionOptions().subscribe({
      next: data => {
        this.academicSessions = data;
        this.loadingSessions  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSessions = false;
        this.cdr.markForCheck();
      }
    });
  }

  onClassChange(): void {
    this.form.sectionId        = '';
    this.form.teacherId        = '';
    this.form.academicSessionId = '';
    this.sections              = [];
    this.teachers              = [];
    this.academicSessions      = [];

    if (!this.form.classId) {
      this.cdr.markForCheck();
      return;
    }

    this.loadSections(this.form.classId);
    this.loadTeachers();
    this.loadAcademicSessions();
    this.cdr.markForCheck();
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.classId)            this.errors['classId'] = 'Required';
    if (!this.form.sectionId)          this.errors['sectionId'] = 'Required';
    if (!this.form.teacherId)          this.errors['teacherId'] = 'Required';
    if (!this.form.academicSessionId)  this.errors['academicSessionId'] = 'Required';
    return !Object.keys(this.errors).length;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.isSubmitting = true;

    const dto: AssignClassTeacherDto = { ...this.form };
    this.teacherService.assignClassTeacher(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resetForm();
        this.assigned.emit();
        this.router.navigate(['/teachers/class-teacher']); 
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/teachers/class-teacher']); 
  }

  resetForm(): void {
    this.form             = { classId: '', sectionId: '', teacherId: '', academicSessionId: '' };
    this.errors           = {};
    this.sections         = [];
    this.teachers         = [];
    this.academicSessions = [];
    this.cdr.markForCheck();
  }
}