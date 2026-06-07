import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import {
  CreateTeacherRequest,
  TeacherFilterRequest,
  TeacherResponseDto,
  PagedResponse,
  ApiResponse,
  AssignClassTeacherRequest,
  AssignClassTeacherResponse,
} from '../models/teacher.model';

// ─── State service: list → form/detail pe teacher pass karne ke liye
@Injectable({ providedIn: 'root' })
export class TeacherStateService {
  private _teacher = new BehaviorSubject<TeacherResponseDto | null>(null);

  set(t: TeacherResponseDto | null): void { this._teacher.next(t); }
  get(): TeacherResponseDto | null        { return this._teacher.getValue(); }
  clear(): void                           { this._teacher.next(null); }
}

// ─── Main teacher service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly BASE = '/teacher';

  constructor(private http: HttpService) {}

  /** POST /api/teacher/list */
  filterTeachers(req: TeacherFilterRequest): Observable<PagedResponse<TeacherResponseDto>> {
    return this.http.post<PagedResponse<TeacherResponseDto>>(`${this.BASE}/list`, req);
  }

  /** POST /api/teacher/addOrUpdate */
  saveTeacher(req: CreateTeacherRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/addOrUpdate`, req);
  }

  /** POST /api/teacher/assignClassTeacher */
  assignClassTeacher(req: AssignClassTeacherRequest): Observable<AssignClassTeacherResponse> {
    return this.http.post<AssignClassTeacherResponse>(`${this.BASE}/assignClassTeacher`, req);
  }
}