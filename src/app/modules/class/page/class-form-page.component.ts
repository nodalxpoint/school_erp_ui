import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassFormComponent } from '../components/class-form/class-form.component';
import { ClassService } from '../services/class.service';
import { Class, CreateClassDto } from '../models/class.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';

@Component({
  selector: 'app-class-form-page',
  standalone: true,
  imports: [CommonModule, ClassFormComponent],
  templateUrl: './class-form-page.component.html',
  styleUrls: ['./class-form-page.component.scss']
})
export class ClassFormPageComponent implements OnInit {
  private schoolId = '';
  private classId: string | null = null;

  editClass: Class | null = null;
  isSubmitting = false;
  isLoading = false;
  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classService: ClassService,
    private authState: AuthStateService
  ) {}




ngOnInit(): void {
  this.schoolId = this.authState.currentUser?.schoolId ?? '';
  this.classId = this.route.snapshot.paramMap.get('id');

  if (this.classId) {
    this.isLoading = true;  // ← pehle loading true
    
    const stateData = history.state?.['classData'];

    if (stateData) {
      this.editClass = {
        id:        stateData.id,
        className: stateData.className,
        sections:  stateData.sections ?? []
      } as Class;
      this.isLoading = false;  // ← data set hone ke baad false
    } else {
      this.classService.getAllClasses(this.schoolId).subscribe({
        next: (classes) => {
          const found = classes.find(c => c.id === this.classId);
          if (found) {
            this.editClass = {
              id:        found.id,
              className: found.className,
              sections:  found.sections ?? []
            } as Class;
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showToast('Failed to load class details', 'error');
        }
      });
    }
  }
}

  get isEditMode(): boolean {
    return !!this.classId;
  }

  
onFormSubmit(dto: CreateClassDto): void {
  this.isSubmitting = true;

  if (this.isEditMode && this.classId) {
    this.classService.updateClass(this.classId, this.schoolId, dto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.goBack(res.message ?? 'Class updated successfully', 'success');
      },
      error: (err) => {
        console.log('UPDATE ERROR:', err);
        this.isSubmitting = false;
        this.showToast('Failed to update class', 'error');
      }
    });
  } else {
    this.classService.createClass(this.schoolId, dto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.goBack(res.message ?? 'Class created successfully', 'success');
      },
      error: (err) => {
        console.log('CREATE ERROR:', err);
        this.isSubmitting = false;
        this.showToast('Failed to create class', 'error');
      }
    });
  }
}

  onCancel(): void {
    this.goBack();
  }

  private goBack(toastMessage?: string, toastType?: 'success' | 'error'): void {
    const state = toastMessage ? { toast: { message: toastMessage, type: toastType } } : {};
    // Works for both /class/form and /class/form/:id
    this.router.navigate(['../'], { relativeTo: this.route, state });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 3500);
  }
}