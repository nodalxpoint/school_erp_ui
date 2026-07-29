import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { FileService } from './services/file.service';
import { UploadedFileDto } from './models/file.model';

@Component({
  selector: 'app-uploaded-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uploaded-files.component.html',
  styleUrls: ['./uploaded-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadedFilesComponent implements OnInit {
  files: UploadedFileDto[] = [];
  totalElements = 0;
  page = 0;
  size = 10;
  isLoading = false;
  isUploading = false;

  searchTerm = '';
  private searchInput$ = new Subject<string>();

  deleteTargetId: string | null = null;
  isDeleting = false;

  toast: { type: 'success' | 'error'; message: string } | null = null;
  private toastTimeoutId: any = null;

  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  constructor(private fileService: FileService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadFiles();

    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.page = 0;
        this.loadFiles();
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchInput$.next(value);
  }

  loadFiles(): void {
    this.isLoading = true;
    this.fileService.filterFiles({
      page: this.page,
      size: this.size,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      search: this.searchTerm || undefined
    })
      .pipe(catchError(err => {
        console.error('File list load failed:', err);
        this.showToast('error', 'Failed to load files.');
        return of(null);
      }))
      .subscribe(res => {
        this.isLoading = false;
        if (res) {
          this.files = res.data ?? [];
          this.totalElements = res.totalElements ?? 0;
        }
        this.cdr.markForCheck();
      });
  }

  triggerFilePicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.cdr.markForCheck();

    this.fileService.uploadFile(file)
      .pipe(catchError(err => {
        console.error('Upload failed:', err);
        this.showToast('error', 'File upload failed.');
        return of(null);
      }))
      .subscribe(res => {
        this.isUploading = false;
        input.value = ''; // reset so same file can be re-selected

        if (res && res.success) {
          this.showToast('success', 'File uploaded successfully!');
          this.page = 0;
          this.loadFiles();
        }
        this.cdr.markForCheck();
      });
  }

  confirmDelete(id: string): void {
    this.deleteTargetId = id;
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
  }

  proceedDelete(): void {
    if (!this.deleteTargetId) return;
    this.isDeleting = true;

    this.fileService.deleteFile(this.deleteTargetId)
      .pipe(catchError(err => {
        console.error('Delete failed:', err);
        this.showToast('error', 'Failed to delete file.');
        return of(null);
      }))
      .subscribe(res => {
        this.isDeleting = false;
        this.deleteTargetId = null;

        if (res && res.success) {
          this.showToast('success', 'File deleted successfully!');
          if (this.files.length === 1 && this.page > 0) this.page--;
          this.loadFiles();
        }
        this.cdr.markForCheck();
      });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.loadFiles();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.size));
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  getFileIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(t)) return 'image';
    if (['pdf'].includes(t)) return 'pdf';
    if (['doc', 'docx'].includes(t)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(t)) return 'sheet';
    if (['ppt', 'pptx'].includes(t)) return 'slide';
    if (['zip', 'rar', '7z'].includes(t)) return 'archive';
    return 'generic';
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toast = { type, message };
    this.cdr.markForCheck();
    clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => {
      this.toast = null;
      this.cdr.markForCheck();
    }, 2500);
  }
}