import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Fix: Corrected typo from '@angular/common/import'
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ParentChildrenApiResponse, ChildStudentDto } from '../models/parent.model';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private baseUrl = `${environment.apiUrl}/parent`;

  private activeChildSubject = new BehaviorSubject<ChildStudentDto | null>(null);
  activeChild$ = this.activeChildSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedChild = sessionStorage.getItem('selected_child');
    if (savedChild) {
      this.activeChildSubject.next(JSON.parse(savedChild));
    }
  }

  // ── ✅ UPDATED TO POST API CALL FLOW ─────────────────────────────────────
  // Empty payload default or customized filter parameters matching model layouts
  getChildrenRegistry(page: number = 0, size: number = 10): Observable<ChildStudentDto[]> {
    const payload = { page, size }; // Dynamic control standard across dashboards
    
    return this.http.post<ParentChildrenApiResponse>(`${this.baseUrl}/myChildren`, payload).pipe(
      map(res => {
        console.log('[ParentService] raw response:', res);
        // Response structure: res.data.data mapping
        return res?.data?.data ?? [];
      })
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
}