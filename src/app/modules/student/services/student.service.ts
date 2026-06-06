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
} from '../models/student.model';

// ─── State service: list → form pe student pass karne ke liye ────
@Injectable({ providedIn: 'root' })
export class StudentStateService {
  private _editStudent = new BehaviorSubject<StudentResponseDto | null>(null);
  editStudent$ = this._editStudent.asObservable();

  setEditStudent(student: StudentResponseDto | null): void {
    this._editStudent.next(student);
  }

  getEditStudent(): StudentResponseDto | null {
    return this._editStudent.getValue();
  }

  clear(): void {
    this._editStudent.next(null);
  }
}

// ─── Main student service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly BASE = '/students';
  private readonly PARAMS_BASE = '/param';

  constructor(private http: HttpService) {}

  /** POST /api/students/list */
  filterStudents(
    request: StudentFilterRequest
  ): Observable<PagedResponse<StudentResponseDto>> {
    return this.http.post<PagedResponse<StudentResponseDto>>(
      `${this.BASE}/list`,
      request
    );
  }

  /** POST /api/students/addOrUpdate */
  saveStudent(request: CreateStudentRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/addOrUpdate`,
      request
    );
  }

  /** POST /api/params/list — type: "classes" */
  getClasses(search = ''): Observable<DropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      sortBy: 'className', sortDirection: 'ASC',
      type: 'classes',
      search: search || undefined,
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.PARAMS_BASE}/list`, req)
      .pipe(map(res => res.data.map(d => ({ id: d.id, label: d.label }))));
  }

  /** POST /api/params/list — type: "sections" (classId required) */
  getSections(classId: string, search = ''): Observable<DropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      sortBy: 'sectionName', sortDirection: 'ASC',
      type: 'sections',
      classId,
      search: search || undefined,
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.PARAMS_BASE}/list`, req)
      .pipe(map(res => res.data.map(d => ({ id: d.id, label: d.label }))));
  }
}
