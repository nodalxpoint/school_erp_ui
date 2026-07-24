import { Injectable } from '@angular/core';

export interface SubjectAssignmentFilterState {
  classId: string;
  sectionId: string;
  teacherId: string;
  subjectId: string;
  academicSessionId: string;
  page: number;
}

/**
 * Holds the subject-teacher-assignment list's filter + pagination state in
 * memory for the lifetime of the app (providedIn: 'root' = one instance
 * for the whole SPA).
 *
 * SubjectAssignmentComponent restores this on ngOnInit so navigating away
 * (another module) and back keeps the same filters + page. It only resets
 * when the user explicitly hits "Clear Filters".
 */
@Injectable({ providedIn: 'root' })
export class SubjectAssignmentStateService {
  private state: SubjectAssignmentFilterState | null = null;

  save(state: SubjectAssignmentFilterState): void {
    this.state = { ...state };
  }

  get(): SubjectAssignmentFilterState | null {
    return this.state ? { ...this.state } : null;
  }

  clear(): void {
    this.state = null;
  }
}