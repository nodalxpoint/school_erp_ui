import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  BulkCreateClassDto,
  Class,
  ClassesDto,
  ClassListApiResponse,
  CreateClassDto
} from '../models/class.model';
import { environment } from '../../../../environments/environment';

export interface ApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ClassService {
  private baseUrl = `${environment.apiUrl}/school/classAndSection`;

  constructor(private http: HttpClient) {}

  // POST /list — paginated response, data[] ke andar classId field hai
getAllClasses(schoolId: string): Observable<ClassesDto[]> {
  return this.http
    .post<any>(`${this.baseUrl}/list`, { schoolId, page: 0, size: 200 })
    .pipe(
      map(res => {
        console.log('[ClassService] raw response:', res); // ← YE DEKH
        const list = res?.data ?? res; // interceptor unwrap kare toh direct array milega
        return (Array.isArray(list) ? list : []).map((item: any) => ({
          id:        item.classId,
          className: item.className,
          sections:  item.sections ?? [],
        }));
      })
    );
}

  getClassById(id: string): Observable<Class> {
    return this.http.get<Class>(`${this.baseUrl}/get/${id}`);
  }

  createClass(schoolId: string, dto: CreateClassDto): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/addOrUpdate`, {
      schoolId,
      className: dto.className,
      sections:  dto.sections ?? [],
    });
  }

updateClass(id: string, schoolId: string, dto: Partial<CreateClassDto>): Observable<ApiResponse> {
  const payload = {
    classId:   id,
    schoolId,
    className: dto.className,
    sections:  (dto.sections ?? []).map(s => 
      typeof s === 'string' ? s : (s as any).sectionName
    ),
  };
  console.log('UPDATE PAYLOAD:', payload); // ← postman jaisa payload dekho
  return this.http.post<ApiResponse>(`${this.baseUrl}/addOrUpdate`, payload);
}



  bulkCreateClasses(schoolId: string, dto: BulkCreateClassDto): Observable<Class[]> {
    return this.http.post<Class[]>(`${this.baseUrl}/bulk?schoolId=${schoolId}`, dto);
  }

  deleteClass(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/delete/${id}`);
  }
}