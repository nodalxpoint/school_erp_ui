import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherListComponent } from '../../components/teacher-list/teacher-list.component';
import { AssignTeacherComponent } from '../../components/assign-teacher/assign-teacher.component';

type Tab = 'list' | 'assign';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [CommonModule, TeacherListComponent, AssignTeacherComponent],
  templateUrl: './teacher-management.component.html',
  styleUrls: ['./teacher-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherManagementComponent {
  activeTab: Tab = 'list';

  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'list',   label: 'All Teachers',  icon: '👥' },
    { id: 'assign', label: 'Assign Teacher', icon: '📌' },
  ];

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }
}