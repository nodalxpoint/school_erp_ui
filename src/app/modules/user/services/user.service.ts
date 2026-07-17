import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserResponseDto, SaveUserRequest, UserListRequest } from '../models/user.model';

// Locally declared structure to bypass cross-module resolution errors
export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private base = `${environment.apiUrl}/superAdmin`;

  constructor(private http: HttpClient) {}

  // ── Core User APIs ────────────────────────────────────────────────────

  listUsers(request: UserListRequest): Observable<PagedResponse<UserResponseDto>> {
    return this.http.post<PagedResponse<UserResponseDto>>(`${this.base}/list`, request);
  }

  addOrUpdateUser(dto: SaveUserRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/addOrUpdate`, dto);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/delete/${id}`);
  }

  regeneratePasskey(userId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/regeneratePasskey`, { userId });
  }
}