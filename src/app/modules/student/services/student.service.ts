import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import {
  CreateStudentRequest,
  StudentFilterRequest,
  StudentResponseDto,
  PagedResponse,
  ApiResponse,
} from '../models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly BASE = '/api/students';

  constructor(private http: HttpService) {}

  /**
   * POST /api/students/list
   */
  filterStudents(
    request: StudentFilterRequest
  ): Observable<PagedResponse<StudentResponseDto>> {
    return this.http.post<PagedResponse<StudentResponseDto>>(
      `${this.BASE}/list`,
      request
    );
  }

  /**
   * POST /api/students/addOrUpdate
   * studentId absent = create, present = update
   */
  saveStudent(request: CreateStudentRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/addOrUpdate`,
      request
    );
  }
}