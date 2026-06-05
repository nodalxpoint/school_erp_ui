// class-management.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassListComponent } from '../components/class-list/class-list.component';
import { ClassService } from '../services/class.service';
import { ClassesDto } from '../models/class.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { ChangeDetectorRef } from '@angular/core';  // ← add ChangeDetectorRef

//  Component, OnDestroy, OnInit
@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ClassListComponent],
  templateUrl: './class-management.component.html',
  styleUrls: ['./class-management.component.scss']
})
export class ClassManagementComponent implements OnInit, OnDestroy {
  private schoolId = '';

  classes: ClassesDto[] = [];
  isLoading = false;
  toast: { message: string; type: 'success' | 'error' } | null = null;
  selectedIds = new Set<string>();
  deleteTargetId: string | null = null;

  constructor(
    private classService: ClassService,
    private authState: AuthStateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.schoolId = this.authState.currentUser?.schoolId ?? '';
    console.log('[ClassMgmt] schoolId:', this.schoolId);
    this.initPage();
  }

  ngOnDestroy(): void {}

  private initPage(): void {
    const state = history.state as { toast?: { message: string; type: 'success' | 'error' } };
    if (state?.toast) {
      this.showToast(state.toast.message, state.toast.type);
    }
    this.loadClasses();
  }

loadClasses(): void {
    this.isLoading = true;
    this.classes = [];

    this.classService.getAllClasses(this.schoolId).subscribe({
      next: data => {
        // setTimeout HATAO, seedha assign karo
        this.classes = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();   // ← yeh add karo
        console.log('[ClassMgmt] loaded:', this.classes.length);
      },
      error: () => {
        // setTimeout HATAO yahan bhi
        this.isLoading = false;
        this.showToast('Failed to load classes', 'error');
        this.cdr.detectChanges();   // ← yahan bhi
      }
    });
  }

  onAdd(): void {
    this.router.navigate(['form'], { relativeTo: this.route });
  }

 onEdit(cls: ClassesDto): void {
  console.log('EDIT CLICKED, sending state:', cls);  // ← ye bhi add karo
  this.router.navigate(['form', cls.id], {
    relativeTo: this.route,
    state: { classData: cls }
  });
}

  confirmDelete(id: string): void { this.deleteTargetId = id; }
  cancelDelete(): void { this.deleteTargetId = null; }

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
      error: () => {
        this.deleteTargetId = null;
        this.showToast('Failed to delete class', 'error');
      }
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
    setTimeout(() => (this.toast = null), 3500);
  }

  get filteredCount(): number { return this.classes.length; }
}