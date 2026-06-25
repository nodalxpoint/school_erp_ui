import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import { PagedResponse, DropdownOption } from '../../student/models/student.model';
import {
  ExamMarksApiDto,
  ExamMarksFilterRequest,
  ExamMarksResponseDto,
  StudentSearchRequest,
  StudentSuggestion,
} from '../models/exam-marks.model';

@Injectable({ providedIn: 'root' })
export class ExamMarksService {
  private readonly BASE     = '/examMarks';
  private readonly PARAMS   = '/param';
  private readonly STUDENTS = '/students';

  constructor(private http: HttpService) {}

  /**
   * POST /param/list
   * type: 'classes' | 'sections' | 'subjects' | 'exams'
   * classId: sections ko ek specific class ke liye filter karne ke liye (optional).
   *   - Page init pe sections bina classId ke call hoti hai (default/disabled list).
   *   - Class select hone par sections classId ke saath dobara call hoti hain (filtered list).
   */
  getDropdownOptions(
    type: 'classes' | 'sections' | 'subjects' | 'exams',
    classId?: string
  ): Observable<DropdownOption[]> {

    const sortByMap: Record<string, string> = {
      classes:  'className',
      sections: 'sectionName',
      subjects: 'subjectName',
      exams:    'examName',
    };

    const req = {
      page:          0,
      size:          150,
    //   sortBy:        sortByMap[type] ?? 'createdAt',
      sortDirection: 'ASC',
      type,
      ...(classId ? { classId } : {}),
    };

    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.PARAMS}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  /**
   * POST /students/list
   * firstName se student suggestions fetch karta hai autocomplete ke liye.
   * Body sirf { firstName } jaata hai — koi page/size/sort wagera nahi.
   */
  searchStudents(firstName: string): Observable<StudentSuggestion[]> {
    const req: StudentSearchRequest = {
      firstName: firstName.trim(),
    };

    return this.http
      .post<PagedResponse<StudentSuggestion>>(`${this.STUDENTS}/list`, req)
      .pipe(map(res => res.data ?? []));
  }

  /** POST /examMarks/list — raw response (records[] nested) */
  filterExamMarks(req: ExamMarksFilterRequest): Observable<PagedResponse<ExamMarksApiDto>> {
    return this.http.post<PagedResponse<ExamMarksApiDto>>(`${this.BASE}/list`, req);
  }
}