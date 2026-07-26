import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ReportQueryRequest, ReportDataResponse, UploadedFileDto } from './services/reports.service';
import { StudentService } from '../student/services/student.service';
import { ExamMarksService } from '../exam-marks/services/exam-marks.service';
import { DropdownOption } from '../student/models/student.model';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  activeTab = 'reportCards';
  loading = false;
  academicSessions: DropdownOption[] = [];
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  exams: DropdownOption[] = [];

  filters = {
    academicSessionId: '',
    classId: '',
    sectionId: '',
    gender: 'All',
    examId: ''
  };

  reportData: ReportDataResponse | null = null;
  reportCardsList: any[] = [];
  currentPrintStudent: any = null;
  currentPage = 0;
  pageSize = 15;

  // ── Import tab state ──
  selectedFile: File | null = null;
  isDragOver = false;
  uploading = false;
  uploadedFile: UploadedFileDto | null = null;
  importError: string | null = null;
  readonly allowedExtensions = ['.xlsx', '.xls', '.csv'];

  constructor(
    private reportsService: ReportsService,
    private studentService: StudentService,
    private examMarksService: ExamMarksService,
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

    this.examMarksService.getDropdownOptions('examIsActive').subscribe(data => {
      this.exams = data;
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
    this.clearImportState();
  }

  clearFilters(): void {
    this.filters = {
      academicSessionId: '',
      classId: '',
      sectionId: '',
      gender: 'All',
      examId: ''
    };
    this.sections = [];
    this.reportData = null;
    this.reportCardsList = [];
    this.currentPrintStudent = null;
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

  loadReportCardsData(): void {
    if (!this.filters.classId || !this.filters.sectionId) {
      return;
    }
    this.loading = true;
    this.reportCardsList = [];
    this.cdr.markForCheck();

    const payload = {
      classId: this.filters.classId,
      sectionId: this.filters.sectionId,
      academicSessionId: this.filters.academicSessionId || undefined,
      examId: this.filters.examId || undefined
    };

    this.reportsService.getReportCards(payload).subscribe({
      next: (data) => {
        this.reportCardsList = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading report cards:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async downloadReportCardsPdf(): Promise<void> {
    if (!this.reportCardsList || this.reportCardsList.length === 0) {
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    try {
      for (const student of this.reportCardsList) {
        this.currentPrintStudent = student;
        this.cdr.detectChanges();

        await new Promise(resolve => setTimeout(resolve, 250));

        const element = document.getElementById('pdf-report-card-template');
        if (element) {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210;
          const pageHeight = 295;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          const filename = `${student.firstName}_${student.lastName || ''}_Report_Card.pdf`.replace(/\s+/g, '_');
          pdf.save(filename);
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      this.currentPrintStudent = null;
      this.loading = false;
      this.cdr.markForCheck();
    }
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

  // ═══════════════════════════════════════════════
  // Import tab (upload only — no data processing)
  // ═══════════════════════════════════════════════

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.setSelectedFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const file = event.dataTransfer?.files && event.dataTransfer.files.length > 0
      ? event.dataTransfer.files[0]
      : null;
    this.setSelectedFile(file);
  }

  private setSelectedFile(file: File | null): void {
    this.uploadedFile = null;
    this.importError = null;

    if (!file) {
      this.selectedFile = null;
      this.cdr.markForCheck();
      return;
    }

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      this.importError = `Unsupported file type. Please upload ${this.allowedExtensions.join(', ')} files only.`;
      this.selectedFile = null;
      this.cdr.markForCheck();
      return;
    }

    this.selectedFile = file;
    this.cdr.markForCheck();
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.uploadedFile = null;
    this.importError = null;
    this.cdr.markForCheck();
  }

  uploadImportFile(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadedFile = null;
    this.importError = null;
    this.cdr.markForCheck();

    this.reportsService.uploadFile(this.selectedFile).subscribe({
      next: (res) => {
        this.uploading = false;
        if (res.success) {
          this.uploadedFile = res.data;
        } else {
          this.importError = res.message || 'Upload failed. Please try again.';
        }
        this.selectedFile = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('File upload failed:', err);
        this.uploading = false;
        this.importError = err?.error?.message || 'Upload failed. Please check the file and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  clearImportState(): void {
    this.selectedFile = null;
    this.isDragOver = false;
    this.uploading = false;
    this.uploadedFile = null;
    this.importError = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}