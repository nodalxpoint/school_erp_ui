import { Injectable } from '@angular/core';

export interface StudentListFilterState {
  searchFirstName: string;
  selectedClassId: string;
  selectedSectionId: string;
  selectedAcademicSessionId: string;
  currentPage: number;
}

/**
 * Holds the student-list's filter + pagination state in memory for the
 * lifetime of the app (providedIn: 'root' = one instance for whole SPA).
 *
 * StudentListComponent reads this on ngOnInit to restore filters after the
 * user navigates away (view/edit/add) and comes back, and writes to it on
 * every filter/page change. clear() is called only when the user explicitly
 * hits "Clear Filters".
 */
@Injectable({ providedIn: 'root' })
export class StudentListStateService {
  private state: StudentListFilterState | null = null;

  save(state: StudentListFilterState): void {
    this.state = { ...state };
  }

  get(): StudentListFilterState | null {
    return this.state ? { ...this.state } : null;
  }

  clear(): void {
    this.state = null;
  }
}