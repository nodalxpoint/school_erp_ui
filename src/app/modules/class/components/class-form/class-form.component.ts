import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Class, ClassFormState, CreateClassDto } from '../../models/class.model';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-form.component.html',
  styleUrls: ['./class-form.component.scss']
})
export class ClassFormComponent implements OnInit, OnChanges {
  @Input() editClass: Class | null = null;
  @Input() isSubmitting = false;
  @Output() formSubmit = new EventEmitter<CreateClassDto>();
  @Output() cancelEdit = new EventEmitter<void>();

  form: ClassFormState = {
    className: '',
    classId: '',
    sections: []
  };

  newSection = '';
  errors: Partial<ClassFormState> = {};

  get isEditMode(): boolean {
    return !!this.editClass;
  }

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editClass']) {
      if (this.editClass) {
        this.form = {
          className: this.editClass.className,
          classId: this.editClass.id,
          sections: []
        };
      } else {
        this.resetForm();
      }
    }
  }

  addSection(): void {
    const s = this.newSection.trim().toUpperCase();
    if (s && !this.form.sections.includes(s)) {
      this.form.sections = [...this.form.sections, s];
      this.newSection = '';
    }
  }

  removeSection(section: string): void {
    this.form.sections = this.form.sections.filter(s => s !== section);
  }

  onSectionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addSection();
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.className.trim()) {
      this.errors.className = 'Class name is required';
    }
    return Object.keys(this.errors).length === 0;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.formSubmit.emit({
      className: this.form.className.trim(),
      classId: this.form.classId || undefined,
      sections: this.form.sections
    });
  }

  onCancel(): void {
    this.resetForm();
    this.cancelEdit.emit();
  }

  resetForm(): void {
    this.form = { className: '', classId: '', sections: [] };
    this.newSection = '';
    this.errors = {};
  }
}