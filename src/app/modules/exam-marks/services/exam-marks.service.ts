import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ExamMarksSavePayload } from '../models/exam-marks.model';
import { BackendExamDto } from '../../exam-schedule/models/exam-schedule.model';
import { PagedResponse, ParamDropdownOption } from '../../timetable/services/timetable.service';

export interface TeacherTimetableEntryDto {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  period: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNo: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  academicSessionName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamMarksService {
  private base = environment.apiUrl; // Default base (http://72.61.229.22/sms/api)

  // ✅ FIX 2: Exact working Postman address endpoint for save submission
  private workingSaveEndpoint = 'http://72.61.229.22:8080/api/examMarks/addOrUpdate';

  constructor(private http: HttpClient) {}

  getMyClassDetails(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.base}/teacher/myClass`);
  }

  // ✅ Teacher's timetable -> used to derive classId/sectionId allocations
  // academicSessionId is OPTIONAL: Admin flow sends it, Teacher (self) flow omits it
  getTeacherTimetable(teacherId: string, academicSessionId?: string): Observable<PagedResponse<TeacherTimetableEntryDto>> {
    const payload: any = {
      page: 0,
      size: 200,
      sortBy: 'period',
      sortDirection: 'asc',
      teacherId
    };
    if (academicSessionId) {
      payload.academicSessionId = academicSessionId;
    }
    return this.http.post<PagedResponse<TeacherTimetableEntryDto>>(`${this.base}/teacherTimetable/list`, payload);
  }

  getExamsWithSubjects(payload: any): Observable<PagedResponse<BackendExamDto>> {
    return this.http.post<PagedResponse<BackendExamDto>>(`${this.base}/exam/list`, payload);
  }

  getStudentsByClassSection(classId: string, sectionId: string): Observable<PagedResponse<any>> {
    // ✅ Passed raw pagination filters payload parameters straight to backend
    const payload = { page: 0, size: 200, classId, sectionId };
    return this.http.post<PagedResponse<any>>(`${this.base}/students/list`, payload);
  }

  saveStudentExamMarks(payload: ExamMarksSavePayload): Observable<{ success: boolean; message: string }> {
    // ✅ FIX: Hitting the exact working postman port address layout directly
    return this.http.post<{ success: boolean; message: string }>(this.workingSaveEndpoint, payload);
  }

  getParamOptions(type: string, classId?: string): Observable<ParamDropdownOption[]> {
    const req: any = { page: 0, size: 100, type: type };
    if (classId) req.classId = classId;

    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.base}/param/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }
}