import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ParentChildrenApiResponse, ChildStudentDto } from '../models/parent.model';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private baseUrl = `${environment.apiUrl}/parent`;
  private attendanceUrl = `${environment.apiUrl}/attendance`; // ✅ FIXED: Attendance list pointer setup safely

  private activeChildSubject = new BehaviorSubject<ChildStudentDto | null>(null);
  activeChild$ = this.activeChildSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedChild = sessionStorage.getItem('selected_child');
    if (savedChild) {
      this.activeChildSubject.next(JSON.parse(savedChild));
    }
  }

  getChildrenRegistry(page: number = 0, size: number = 10): Observable<ChildStudentDto[]> {
    const payload = { page, size };
    return this.http.post<ParentChildrenApiResponse>(`${this.baseUrl}/myChildren`, payload).pipe(
      map(res => res?.data?.data ?? [])
    );
  }

  /** ✅ UPDATED: Target endpoint attendance/list with integer payload schemas */
  getAttendanceRegistry(studentId: string, month: number, year: number): Observable<any> {
    const payload = {
      studentId,
      month, // Integer e.g., 5
      year   // Integer e.g., 2026
    };
    
    return this.http.post<any>(`${this.attendanceUrl}/list`, payload).pipe(
      map(res => res?.data ?? []) // Returns array list directly from backend envelope
    );
  }

  setActiveChild(child: ChildStudentDto): void {
    sessionStorage.setItem('selected_child', JSON.stringify(child));
    this.activeChildSubject.next(child);
  }

  getActiveChildValue(): ChildStudentDto | null {
    return this.activeChildSubject.value;
  }

  clearActiveChild(): void {
    sessionStorage.removeItem('selected_child');
    this.activeChildSubject.next(null);
  }


  // Is method ko modules/parent/services/parent.service.ts ke andar append karein

getChildTimetable(classId: string, sectionId: string): Observable<any> {
  const payload = {
    page: 0,
    size: 200,
    classId: classId,
    sectionId: sectionId
  };
  
  return this.http.post<any>(`${environment.apiUrl}/timetable/list`, payload).pipe(
    map(res => res?.data ?? []) // Returns core list directly from backend envelope
  );
}



// Is code snippet ko src/app/modules/parent/services/parent.service.ts me append karein

/** ✅ NEW: Load Exams Dropdown Context Parameters */
getParentExamsList(): Observable<any[]> {
  const req = {
    page: 0,
    size: 150,
    sortDirection: 'ASC',
    type: 'exams'
  };
  return this.http.post<any>(`${environment.apiUrl}/param/list`, req).pipe(
    map(res => res?.data ?? [])
  );
}

/** ✅ NEW: Fetch Student Specific Assessment Results Matrix */
getParentExamMarks(examId: string, studentId: string): Observable<any[]> {
  const payload = {
    examId: examId,
    studentId: studentId
  };
  return this.http.post<any>(`${environment.apiUrl}/examMarks/list`, payload).pipe(
    map(res => res?.data ?? [])
  );
}


}