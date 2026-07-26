import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService, UploadedFileDto } from '../reports/services/reports.service';

@Component({
  selector: 'app-uploaded-files',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploaded-files.component.html',
  styleUrls: ['./uploaded-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadedFilesComponent implements OnInit {
  files: UploadedFileDto[] = [];
  loading = false;
  errorMsg: string | null = null;
  deletingId: string | null = null;

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.reportsService.listFiles().subscribe({
      next: (res) => {
        this.files = res.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load uploaded files:', err);
        this.errorMsg = 'Could not load files. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  downloadFile(file: UploadedFileDto): void {
    const link = document.createElement('a');
    link.href = file.filePath;
    link.setAttribute('download', file.fileName);
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteFile(file: UploadedFileDto): void {
    this.deletingId = file.id;
    this.cdr.markForCheck();

    this.reportsService.deleteUploadedFile(file.id).subscribe({
      next: () => {
        this.files = this.files.filter(f => f.id !== file.id);
        this.deletingId = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to delete file:', err);
        this.errorMsg = 'Could not delete the file. Please try again.';
        this.deletingId = null;
        this.cdr.markForCheck();
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}