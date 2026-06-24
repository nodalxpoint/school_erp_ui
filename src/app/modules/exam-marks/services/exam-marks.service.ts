import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ExamMarksSavePayload } from '../models/exam-marks.model';
import { PagedResponse, ParamDropdownOption } from '../../timetable/services/timetable.service';

export interface TeacherClassMapDto {
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamMarksService {
  private base = environment.apiUrl; // http://72.61.229.22/sms/api

  // New POST API Target Endpoints
  private myClassesListUrl = 'http://72.61.229.22:8080/api/teacher/myClassesList';
  private workingSaveEndpoint = 'http://72.61.229.22:8080/api/examMarks/addOrUpdate';

  constructor(private http: HttpClient) {}

  getTeacherClassesList(): Observable<{ success: boolean; message: string; data: TeacherClassMapDto[] }> {
    return this.http.post<{ success: boolean; message: string; data: TeacherClassMapDto[] }>(this.myClassesListUrl, {});
  }

  // ✅ FIXED: Payload me ab classId aur sectionId ke sath examId bhi strictly add ho gayi hai!
  getStudentsByClassSection(classId: string, sectionId: string, examId: string): Observable<PagedResponse<any>> {
    const payload = { 
      page: 0, 
      size: 200, 
      classId, 
      sectionId,
      examId: examId // <-- Payload criteria configured exactly as requested!
    };
    return this.http.post<PagedResponse<any>>(`${this.base}/students/list`, payload);
  }

  saveStudentExamMarks(payload: ExamMarksSavePayload): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.workingSaveEndpoint, payload);
  }

  getParamOptions(type: string): Observable<ParamDropdownOption[]> {
    const req = { page: 0, size: 100, type: type };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.base}/param/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  getActiveExamFromParam(): Observable<any> {
    return this.http.post<any>(`${this.base}/param/list`, { type: 'examIsActive' });
  }
}