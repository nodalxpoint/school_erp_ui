import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../models/student.model';

export interface ProgressionItem {
  studentId: string;
  classId: string;
  sectionId: string;
  status: 'PASS' | 'FAIL';
  remarks: string | null;
}

export interface StudentProgressionBulkSaveDto {
  academicSessionId: string;
  progressions: ProgressionItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ProgressionService {
  private readonly BASE = '/studentProgression';

  constructor(private http: HttpService) {}

  addOrUpdateProgression(dto: StudentProgressionBulkSaveDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/addOrUpdate`, dto);
  }
}
