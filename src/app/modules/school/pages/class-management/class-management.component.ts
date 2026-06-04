import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassFormComponent } from '../../components/class-form/class-form.component';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, ClassFormComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1>Class & Section Management</h1>
        <p>Create classes and manage sections</p>
      </div>
      <app-class-form (classSaved)="onClassSaved()"></app-class-form>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 1.5rem 2rem;
      max-width: 700px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header h1 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .page-header p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted, #6b7280);
    }
    @media (max-width: 768px) {
      .page-wrapper { padding: 1rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassManagementComponent {
  onClassSaved(): void {
    // TODO: refresh class list when GET API is available
  }
}