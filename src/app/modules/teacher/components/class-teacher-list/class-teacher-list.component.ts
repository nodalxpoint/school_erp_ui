import {
  Component, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import {
  TeacherFilterRequest,
  TeacherResponseDto,
  PagedResponse
} from '../../models/teacher.model';
import { TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-class-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-teacher-list.component.html',
  styleUrls: ['./class-teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassTeacherListComponent implements OnInit {
  assignments: any[] = []; 
  isLoadingList = false;
  totalPages    = 0;
  totalElements = 0;
  currentPage   = 0; // 🌟 HTML me direct binding ke liye numeric track banaya

  filter: TeacherFilterRequest = {
    page: 0, 
    size: 200, 
    sortBy: 'joiningDate', 
    sortDirection: 'desc'
  };
  filterTeacherName = '';

  constructor(
    private teacherService: TeacherService,
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoadingList = true;
    this.filter.page = this.currentPage; // Synchronize with explicit tracking
    this.cdr.markForCheck();

    this.teacherService.filterTeachers({
      ...this.filter,
      firstName: this.filterTeacherName.trim() || undefined
    }).subscribe({
      next: (res: PagedResponse<TeacherResponseDto>) => {
        this.assignments   = res.data ?? [];
        this.totalPages    = res.totalPages ?? 1;
        this.totalElements = res.totalElements ?? 0;
        this.isLoadingList = false;
        this.cdr.markForCheck();
      },
      error: () => { 
        this.assignments = [];
        this.isLoadingList = false; 
        this.cdr.markForCheck(); 
      }
    });
  }

  onAssignTeacherRoute(): void {
    this.router.navigate(['/teachers/assign']); 
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadAssignments();
  }

  changePage(p: number): void {
    if (p >= 0 && p < this.totalPages) {
      this.currentPage = p;
      this.loadAssignments();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}