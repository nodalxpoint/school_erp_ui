import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import {
  CreateStudentRequest,
  StudentFilterRequest,
  StudentResponseDto,
  PagedResponse,
  ApiResponse,
  ParamListRequest,
  DropdownOption,
  ParentSearchResultDto,
  ParentSearchRequest,
  ParentSearchApiResponse,
} from '../models/student.model';

// ─── State service: list → form/detail pe student pass karne ke liye ─
@Injectable({ providedIn: 'root' })
export class StudentStateService {
  private _student = new BehaviorSubject<StudentResponseDto | null>(null);
  student$ = this._student.asObservable();

  set(student: StudentResponseDto | null): void {
    this._student.next(student);
  }

  get(): StudentResponseDto | null {
    return this._student.getValue();
  }

  clear(): void {
    this._student.next(null);
  }
}

// ─── Main student service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class StudentService {
  // ✅ old working endpoints (safe)
  private readonly BASE = '/students';
  private readonly PARAMS = '/param';

  constructor(private http: HttpService) {}

  /** POST /students/list */
  filterStudents(req: StudentFilterRequest): Observable<PagedResponse<StudentResponseDto>> {
    return this.http.post<PagedResponse<StudentResponseDto>>(
      `${this.BASE}/list`,
      req
    );
  }

  /** POST /students/addOrUpdate */
  saveStudent(req: CreateStudentRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/addOrUpdate`,
      req
    );
  }

  searchExistingParents(req: ParentSearchRequest): Observable<ParentSearchResultDto[]> {
    return this.http.post<ParentSearchApiResponse>(`/parent/list`, req).pipe(
      map(res => {
        console.log('[StudentService] parent search raw response:', res);
        return res?.data?.data ?? [];
      })
    );
  }
  // student.service.ts — StudentService class me add karo

  
/** Single student fetch by id — same /students/list endpoint reuse karke */
getStudentById(id: string): Observable<StudentResponseDto | null> {
  const req: StudentFilterRequest = {
    page: 0,
    size: 1,
    sortBy: 'firstName',
    sortDirection: 'ASC',
    id,
  };

  return this.filterStudents(req).pipe(
    map(res => (res.data && res.data.length > 0) ? res.data[0] : null)
  );
}

  /** classes dropdown */
  getClasses(search = ''): Observable<DropdownOption[]> {
    const req: ParamListRequest = {
      page: 0,
      size: 100,
      sortBy: 'className', // ✅ revert to old
      sortDirection: 'ASC',
      type: 'classes',
      search: search || undefined,
    };

    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(
        `${this.PARAMS}/list`,
        req
      )
      .pipe(map(res => (res.data ?? []).map(d => ({
        id: d.id,
        label: d.label,
      }))));
  }

  /** academic sessions dropdown */
  getAcademicSessions(classId: string, search = ''): Observable<DropdownOption[]> {
    const req: ParamListRequest = {
      page: 0,
      size: 100,
      sortBy: 'sessionName',
      sortDirection: 'ASC',
      type: 'academic_sessions',
      classId,
      search: search || undefined,
    };

    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(
        `${this.PARAMS}/list`,
        req
      )
      .pipe(map(res => (res.data ?? []).map(d => ({
        id: d.id,
        label: d.label,
      }))));
  }

  /** sections dropdown */
  getSections(classId: string, search = ''): Observable<DropdownOption[]> {
    const req: ParamListRequest = {
      page: 0,
      size: 100,
      sortBy: 'sectionName', // ✅ revert to old
      sortDirection: 'ASC',
      type: 'sections',
      classId,
      search: search || undefined,
    };

    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(
        `${this.PARAMS}/list`,
        req
      )
      .pipe(map(res => (res.data ?? []).map(d => ({
        id: d.id,
        label: d.label,
      }))));
  }
}