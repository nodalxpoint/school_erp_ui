import { Injectable } from '@angular/core';

export interface ClassTeacherListFilterState {
  filterTeacherName: string;
  filterClassId: string;
  filterSectionId: string;
  filterAcademicSessionId: string;
  page: number;
}

/**
 * Holds the class-teacher-list's filter + pagination state in memory for
 * the lifetime of the app (providedIn: 'root' = one instance for whole SPA).
 *
 * ClassTeacherListComponent restores this on ngOnInit so navigating to the
 * assign/edit screen and coming back keeps the same filters + page. It only
 * resets when the user explicitly hits "Clear Filters".
 */
@Injectable({ providedIn: 'root' })
export class ClassTeacherListStateService {
  private state: ClassTeacherListFilterState | null = null;

  save(state: ClassTeacherListFilterState): void {
    this.state = { ...state };
  }

  get(): ClassTeacherListFilterState | null {
    return this.state ? { ...this.state } : null;
  }

  clear(): void {
    this.state = null;
  }
}