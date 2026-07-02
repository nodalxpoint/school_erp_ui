import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service'; // Adjust path accordingly
import { StudentFeeResponseDto, FeeFilterRequest, SaveFeeRequest } from '../models/fee.model';
import { PagedResponse, ApiResponse, DropdownOption, ParamListRequest } from '../../student/models/student.model';

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly BASE = '/studentFees';
  private readonly PARAMS = '/param';

  constructor(private http: HttpService) {}

  /** List Fees with Filters */
  filterFees(req: FeeFilterRequest): Observable<PagedResponse<StudentFeeResponseDto>> {
    return this.http.post<PagedResponse<StudentFeeResponseDto>>(`${this.BASE}/list`, req);
  }

  /** Add or Update Fee */
  saveFee(req: SaveFeeRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/addOrUpdate`, req);
  }

  /** Fetch Dropdown Data using Param API */
 /** Fetch Dropdown Data using Param API */
  getParams(type: 'classes' | 'sections' | 'academic_sessions', classId?: string, search?: string): Observable<DropdownOption[]> {
    // Yahan hum sortBy aur sortDirection ko default values de rahe hain
    // taaki interface requirement satisfy ho jaye aur error na aaye.
    const req: ParamListRequest = {
      page: 0,
      size: 100,
      sortBy: 'id',          // Default value add kar di
      sortDirection: 'ASC',  // Default value add kar di
      type,
      classId,
      search
    };

    return this.http.post<PagedResponse<{id: string, label: string}>>(`${this.PARAMS}/list`, req)
      .pipe(map(res => res.data ?? []));
  }


  /** Fetch Student Array Matrix dynamically matching search token criteria */
  getStudentsList(searchName: string = ''): Observable<any[]> {
    const payload = {
      page: 0,
      size: 30,
      sortBy: 'firstName',
      sortDirection: 'ASC'
    };
    return this.http.post<any>('/students/list', payload).pipe(
      map(res => {
        const list = res?.data ?? [];
        if (!searchName) return list;
        return list.filter((s: any) => 
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchName.toLowerCase()) ||
          (s.admissionNo && s.admissionNo.toLowerCase().includes(searchName.toLowerCase()))
        );
      })
    );
  }
}