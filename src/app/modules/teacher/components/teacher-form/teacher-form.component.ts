import {
  Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateTeacherDto, TeacherFormState, TeacherResponseDto } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrls: ['./teacher-form.component.scss']
})
export class TeacherFormComponent implements OnInit, OnChanges {
  @Input() editTeacher: TeacherResponseDto | null = null;
  @Input() isSubmitting = false;
  @Output() formSubmit = new EventEmitter<CreateTeacherDto>();
  @Output() cancelEdit = new EventEmitter<void>();

  form: TeacherFormState = this.blank();
  errors: Partial<TeacherFormState> = {};
  showPassword = false;

  get isEditMode(): boolean { return !!this.editTeacher; }

  ngOnInit(): void { this.resetForm(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editTeacher']) {
      if (this.editTeacher) {
        this.form = {
          userId:        this.editTeacher.userId ?? '',
          firstName:     this.editTeacher.firstName ?? '',
          lastName:      this.editTeacher.lastName ?? '',
          email:         this.editTeacher.email ?? '',
          password:      '',
          employeeCode:  this.editTeacher.employeeCode ?? '',
          qualification: this.editTeacher.qualification ?? '',
          joiningDate:   this.editTeacher.joiningDate?.substring(0, 10) ?? ''
        };
      } else {
        this.resetForm();
      }
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.firstName.trim()) this.errors.firstName = 'First name required';
    if (!this.form.email.trim())     this.errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      this.errors.email = 'Invalid email';
    if (!this.isEditMode && !this.form.password.trim())
      this.errors.password = 'Password required for new teacher';
    return !Object.keys(this.errors).length;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    const dto: CreateTeacherDto = {
      firstName:     this.form.firstName.trim(),
      lastName:      this.form.lastName.trim() || undefined,
      email:         this.form.email.trim(),
      employeeCode:  this.form.employeeCode.trim() || undefined,
      qualification: this.form.qualification.trim() || undefined,
      joiningDate:   this.form.joiningDate || undefined
    };
    if (this.isEditMode)   dto.userId   = this.form.userId;
    else                   dto.password = this.form.password;
    this.formSubmit.emit(dto);
  }

  onCancel(): void { this.resetForm(); this.cancelEdit.emit(); }

  resetForm(): void { this.form = this.blank(); this.errors = {}; }

  private blank(): TeacherFormState {
    return { userId: '', firstName: '', lastName: '', email: '',
             password: '', employeeCode: '', qualification: '', joiningDate: '' };
  }
}