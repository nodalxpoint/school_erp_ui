import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassFormComponent } from '../components/class-form/class-form.component';
import { ClassListComponent } from '../components/class-list/class-list.component';
import { ClassService } from '../services/class.service';
import { BulkCreateClassDto, Class, ClassesDto, CreateClassDto } from '../models/class.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';

type Tab = 'list' | 'add' | 'bulk';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ClassFormComponent, ClassListComponent],
  templateUrl: './class-management.component.html',
  styleUrls: ['./class-management.component.scss']
})
export class ClassManagementComponent implements OnInit {
  private schoolId = '';

  activeTab: Tab = 'list';
  classes: ClassesDto[] = [];
  editTarget: Class | null = null;
  isLoading = false;
  isSubmitting = false;
  toast: { message: string; type: 'success' | 'error' } | null = null;

  selectedIds = new Set<string>();

  bulkRows: { className: string; classId: string; sections: string; error?: string }[] = [
    { className: '', classId: '', sections: '' }
  ];

  deleteTargetId: string | null = null;

  constructor(
    private classService: ClassService,
    private authState: AuthStateService
  ) {}

  ngOnInit(): void {
    this.schoolId = this.authState.currentUser?.schoolId ?? '';
    this.loadClasses();
  }

  loadClasses(): void {
    this.isLoading = true;
    this.classService.getAllClasses(this.schoolId).subscribe({
      next: data => { this.classes = data; this.isLoading = false; },
      error: () => { this.isLoading = false; this.showToast('Failed to load classes', 'error'); }
    });
  }

  onFormSubmit(dto: CreateClassDto): void {
    this.isSubmitting = true;
    if (this.editTarget) {
      // UPDATE — classId pass karo
      this.classService.updateClass(this.editTarget.id, this.schoolId, dto).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.editTarget = null;
          this.activeTab = 'list';
          this.showToast(res.message ?? 'Class updated successfully', 'success');
          this.loadClasses();
        },
        error: () => { this.isSubmitting = false; this.showToast('Failed to update class', 'error'); }
      });
    } else {
      // CREATE — classId nahi bhejo
      this.classService.createClass(this.schoolId, dto).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.activeTab = 'list';
          this.showToast(res.message ?? 'Class created successfully', 'success');
          this.loadClasses();
        },
        error: () => { this.isSubmitting = false; this.showToast('Failed to create class', 'error'); }
      });
    }
  }

  onEdit(cls: ClassesDto): void {
    this.classService.getClassById(cls.id).subscribe({
      next: full => { this.editTarget = full; this.activeTab = 'add'; },
      error: () => this.showToast('Failed to load class details', 'error')
    });
  }

  onCancelEdit(): void {
    this.editTarget = null;
    this.activeTab = 'list';
  }

  confirmDelete(id: string): void {
    this.deleteTargetId = id;
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
  }

  doDelete(): void {
    if (!this.deleteTargetId) return;
    const id = this.deleteTargetId;
    this.classService.deleteClass(id).subscribe({
      next: (res) => {
        this.deleteTargetId = null;
        this.selectedIds.delete(id);
        this.showToast(res.message ?? 'Class deleted', 'success');
        this.loadClasses();
      },
      error: () => { this.deleteTargetId = null; this.showToast('Failed to delete class', 'error'); }
    });
  }

  addBulkRow(): void {
    this.bulkRows.push({ className: '', classId: '', sections: '' });
  }

  removeBulkRow(i: number): void {
    if (this.bulkRows.length > 1) this.bulkRows.splice(i, 1);
  }

  validateBulkRows(): boolean {
    let valid = true;
    this.bulkRows.forEach(row => {
      row.error = '';
      if (!row.className.trim()) { row.error = 'Required'; valid = false; }
    });
    return valid;
  }

  submitBulk(): void {
    if (!this.validateBulkRows()) return;
    const dto: BulkCreateClassDto = {
      classes: this.bulkRows.map(r => ({
        className: r.className.trim(),
        classId:   r.classId.trim() || undefined,
        sections:  r.sections ? r.sections.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []
      }))
    };
    this.isSubmitting = true;
    this.classService.bulkCreateClasses(this.schoolId, dto).subscribe({
      next: created => {
        this.isSubmitting = false;
        this.bulkRows = [{ className: '', classId: '', sections: '' }];
        this.activeTab = 'list';
        this.showToast(`${created.length} classes imported successfully`, 'success');
        this.loadClasses();
      },
      error: () => { this.isSubmitting = false; this.showToast('Bulk import failed', 'error'); }
    });
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.selectedIds = new Set(this.selectedIds);
  }

  toggleSelectAll(checked: boolean): void {
    this.selectedIds = checked ? new Set(this.classes.map(c => c.id)) : new Set();
  }

  bulkDelete(): void {
    const ids = [...this.selectedIds];
    ids.forEach(id => {
      this.classService.deleteClass(id).subscribe({ next: () => {}, error: () => {} });
    });
    this.showToast(`${ids.length} classes deleted`, 'success');
    this.selectedIds = new Set();
    this.loadClasses();
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 3500);
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab !== 'add') this.editTarget = null;
  }

  get filteredCount(): number { return this.classes.length; }
}