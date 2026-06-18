import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BackendExamDto, ExamSubjectDto } from '../models/exam-schedule.model';

export interface ParamDropdownOption {
  id: string;
  label: string;
}

export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamScheduleService {
  private base = `${environment.apiUrl}/exam`;
  private param = `${environment.apiUrl}/param`;

  constructor(private http: HttpClient) {}

  // ── 📅 Fetch Schedule Items Loop from Main Exam List Endpoints ──────────
  getExamsWithSubjects(payload: any): Observable<PagedResponse<BackendExamDto>> {
    return this.http.post<PagedResponse<BackendExamDto>>(`${this.base}/list`, payload);
  }

  // ── 🔄 Commit Subject mapping matrix setup ───────────────────────────────
  addOrUpdateExamSubject(dto: ExamSubjectDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.base}/subject/addOrUpdate`, dto);
  }

  // ── 🗂 Param Context drop listings ───────────────────────────────────────
  getDropdownOptions(type: 'classes' | 'subjects' | 'academic_sessions'): Observable<ParamDropdownOption[]> {
    const req = { page: 0, size: 100, type: type };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }
}