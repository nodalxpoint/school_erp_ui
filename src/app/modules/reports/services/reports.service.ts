import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';

export interface ReportQueryRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc' | 'ASC' | 'DESC';
  filters: Record<string, any>;
}

export interface ReportDataResponse {
  reportName: string;
  headers: string[];
  rows: Record<string, any>[];
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UploadedFileDto {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly BASE = '/reports';
  private readonly FILES_BASE = '/files';

  constructor(private http: HttpService) {}

  previewReport(moduleType: string, request: ReportQueryRequest): Observable<ReportDataResponse> {
    return this.http.post<ReportDataResponse>(
      `${this.BASE}/preview/${moduleType}`,
      request
    );
  }

  getReportCards(request: { classId: string; sectionId: string; academicSessionId?: string; examId?: string }): Observable<any[]> {
    return this.http.post<any[]>(`${this.BASE}/reportCards`, request);
  }
  // ── Import: uploads file to storage (R2) and saves its metadata ──
  uploadFile(file: File): Observable<ApiResponse<UploadedFileDto>> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ApiResponse<UploadedFileDto>>(`${this.FILES_BASE}/upload`, formData);
  }

  // ── Uploaded Files screen: list + delete ──
  // ⚠️ Assumed endpoint: GET /api/files — update the path once the real
  // list API is finalized on the backend.
  listFiles(): Observable<ApiResponse<UploadedFileDto[]>> {
    return this.http.get<ApiResponse<UploadedFileDto[]>>(`${this.FILES_BASE}`);
  }

  deleteUploadedFile(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.FILES_BASE}/${id}`);
  }
}