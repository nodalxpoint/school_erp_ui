import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AcademicSessionFilterRequest,
  AcademicSessionResponseDto,
  CreateAcademicSessionDto,
  PagedResponse
} from '../models/academic-session.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AcademicSessionService {
  private base = `${environment.apiUrl}/academic-session`;

  constructor(private http: HttpClient) {}

  filter(request: AcademicSessionFilterRequest): Observable<PagedResponse<AcademicSessionResponseDto>> {
    return this.http.post<PagedResponse<AcademicSessionResponseDto>>(`${this.base}/list`, request);
  }

  // Convenience: sirf active sessions as dropdown options
  getActiveSessionOptions(schoolId?: string): Observable<{ id: string; name: string }[]> {
    return this.filter({ page: 0, size: 100, sortBy: 'startDate', sortDirection: 'desc', schoolId })
      .pipe(
        map(res => (res.data ?? []).map(s => ({ id: s.id, name: s.sessionName })))
      );
  }

  addOrUpdate(dto: CreateAcademicSessionDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/addOrUpdate`, dto);
  }
}