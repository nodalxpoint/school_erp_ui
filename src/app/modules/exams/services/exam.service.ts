import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ExamDto, ExamFilterRequest } from '../models/exam.model';
import { PagedResponse, ParamDropdownOption } from '../../timetable/services/timetable.service';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private base = `${environment.apiUrl}/exam`;
  private param = `${environment.apiUrl}/param`;

  constructor(private http: HttpClient) {}

  // ── Exam List API Call ───────────────────────────────────────────────────
  getExamsList(request: ExamFilterRequest): Observable<PagedResponse<ExamDto>> {
    return this.http.post<PagedResponse<ExamDto>>(`${this.base}/list`, request);
  }

  // ── Exam Save / Update Dynamic Call ──────────────────────────────────────
  addOrUpdateExam(dto: ExamDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.base}/addOrUpdate`, dto);
  }

  // ── Shared Academic Sessions Dropdown Loader ─────────────────────────────
  getAcademicSessions(): Observable<ParamDropdownOption[]> {
    const req = { page: 0, size: 50, type: 'academic_sessions' };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }
}