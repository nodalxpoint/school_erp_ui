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

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly BASE = '/reports';

  constructor(private http: HttpService) {}

  previewReport(moduleType: string, request: ReportQueryRequest): Observable<ReportDataResponse> {
    return this.http.post<ReportDataResponse>(
      `${this.BASE}/preview/${moduleType}`,
      request
    );
  }
}
