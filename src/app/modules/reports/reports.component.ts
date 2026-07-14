import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ReportQueryRequest, ReportDataResponse } from './services/reports.service';
import { StudentService } from '../student/services/student.service';
import { DropdownOption } from '../student/models/student.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  activeTab = 'students';
  loading = false;
  
  academicSessions: DropdownOption[] = [];
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];

  filters = {
    academicSessionId: '',
    classId: '',
    sectionId: '',
    gender: 'All'
  };

  reportData: ReportDataResponse | null = null;
  currentPage = 0;
  pageSize = 15;

  constructor(
    private reportsService: ReportsService,
    private studentService: StudentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  loadFilterOptions(): void {
    this.studentService.getClasses().subscribe(data => {
      this.classes = data;
      this.cdr.markForCheck();
    });

    this.studentService.getAcademicSessions().subscribe(data => {
      this.academicSessions = data;
      this.cdr.markForCheck();
    });
  }

  onClassChange(): void {
    this.filters.sectionId = '';
    this.sections = [];
    if (this.filters.classId) {
      this.studentService.getSections(this.filters.classId).subscribe(data => {
        this.sections = data;
        this.cdr.markForCheck();
      });
    }
  }

  switchTab(tabName: string): void {
    this.activeTab = tabName;
    this.clearFilters();
  }

  clearFilters(): void {
    this.filters = {
      academicSessionId: '',
      classId: '',
      sectionId: '',
      gender: 'All'
    };
    this.sections = [];
    this.reportData = null;
    this.currentPage = 0;
    this.cdr.markForCheck();
  }

  generateReport(page = 0): void {
    this.loading = true;
    this.currentPage = page;
    this.cdr.markForCheck();

    const req: ReportQueryRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'firstName',
      sortDirection: 'ASC',
      filters: {
        academicSessionId: this.filters.academicSessionId || undefined,
        classId: this.filters.classId || undefined,
        sectionId: this.filters.sectionId || undefined,
        gender: this.filters.gender !== 'All' ? this.filters.gender : undefined
      }
    };

    this.reportsService.previewReport(this.activeTab, req).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading report data:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || (this.reportData && page >= this.reportData.totalPages)) return;
    this.generateReport(page);
  }

  exportReport(): void {
    if (!this.reportData || this.reportData.rows.length === 0) return;

    const headers = this.reportData.headers;
    let csvContent = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    this.reportData.rows.forEach(row => {
      const line = headers.map(h => {
        const val = row[h] !== undefined ? String(row[h]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.reportData.reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  get pages(): number[] {
    if (!this.reportData) return [];
    const total = this.reportData.totalPages;
    const cur = this.currentPage;
    let start = Math.max(0, cur - 2);
    let end = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(total - 1, 4);
      else start = Math.max(0, end - 4);
    }
    return Array.from({ length: Math.min(total, end - start + 1) }, (_, i) => start + i);
  }

  get startIndex(): number { 
    return this.currentPage * this.pageSize + 1; 
  }
  
  get endIndex(): number { 
    if (!this.reportData) return 0;
    return Math.min((this.currentPage + 1) * this.pageSize, this.reportData.totalElements); 
  }
}
