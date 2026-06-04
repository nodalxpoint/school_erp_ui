import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BulkCreateClassDto, Class, ClassesDto, CreateClassDto } from '../models/class.model';
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

  getAllClasses(schoolId: string): Observable<ClassesDto[]> {
    return this.http.get<ClassesDto[]>(`${this.baseUrl}/getAll?schoolId=${schoolId}`);
  }

  getClassById(id: string): Observable<Class> {
    return this.http.get<Class>(`${this.baseUrl}/get/${id}`);
  }

  // CREATE — schoolId body mein, classId nahi
  createClass(schoolId: string, dto: CreateClassDto): Observable<ApiResponse> {
    const body = {
      schoolId:  schoolId,        // ← backend ko chahiye
      className: dto.className,
      sections:  dto.sections ?? [],
    };
    return this.http.post<ApiResponse>(`${this.baseUrl}/addOrUpdate`, body);
  }

  // UPDATE — schoolId + classId dono body mein
  updateClass(id: string, schoolId: string, dto: Partial<CreateClassDto>): Observable<ApiResponse> {
    const body = {
      schoolId:  schoolId,        // ← backend ko chahiye
      classId:   id,
      className: dto.className,
      sections:  dto.sections ?? [],
    };
    return this.http.post<ApiResponse>(`${this.baseUrl}/addOrUpdate`, body);
  }

  bulkCreateClasses(schoolId: string, dto: BulkCreateClassDto): Observable<Class[]> {
    return this.http.post<Class[]>(`${this.baseUrl}/bulk?schoolId=${schoolId}`, dto);
  }

  deleteClass(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/delete/${id}`);
  }
}