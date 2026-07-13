// src/app/modules/udise/services/udise.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { PagedResponse, ApiResponse } from '../../student/models/student.model';
import { StudentUdiseResponseDto, SaveStudentUdiseDto, StudentUdiseFilterRequest } from '../models/udise.model';

@Injectable({ providedIn: 'root' })
export class UdiseService {
  private readonly BASE = '/udise';

  constructor(private http: HttpService) {}

  /** POST /api/udise/list */
  filterUdise(req: StudentUdiseFilterRequest): Observable<PagedResponse<StudentUdiseResponseDto>> {
    return this.http.post<PagedResponse<StudentUdiseResponseDto>>(
      `${this.BASE}/list`,
      req
    );
  }

  /** POST /api/udise/addOrUpdate */
  addOrUpdateUdise(req: SaveStudentUdiseDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/addOrUpdate`,
      req
    );
  }
}
