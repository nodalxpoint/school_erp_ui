import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import {
  AcademicSessionResponseDto,
  AcademicSessionFilterRequest,
} from '../models/academic-session.model';
import { PagedResponse } from '../../teacher/models/teacher.model';

@Injectable({ providedIn: 'root' })
export class AcademicSessionService {
  private readonly BASE = '/api/academic-session';

  constructor(private http: HttpService) {}

  /**
   * POST /api/academic-session/list
   * Fetch all sessions — pass isActive: true to get only active ones
   */
  listSessions(
    request: AcademicSessionFilterRequest
  ): Observable<PagedResponse<AcademicSessionResponseDto>> {
    return this.http.post<PagedResponse<AcademicSessionResponseDto>>(
      `${this.BASE}/list`,
      request
    );
  }
}