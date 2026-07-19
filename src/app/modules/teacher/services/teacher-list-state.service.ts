import { Injectable } from '@angular/core';

export interface TeacherListFilterState {
  searchText: string;
  page: number;
}

/**
 * Holds the teacher-list's search text + current page in memory for the
 * lifetime of the app (providedIn: 'root' = one instance for whole SPA).
 *
 * TeacherListComponent restores this on ngOnInit so navigating to
 * view/edit/add and coming back keeps the same search + page. It only
 * resets when the user explicitly clears the search (the × button), which
 * calls onSearch() with an empty searchText and re-persists that as the
 * new state — there's no separate "clear filters" action here since search
 * is the only filter.
 */
@Injectable({ providedIn: 'root' })
export class TeacherListStateService {
  private state: TeacherListFilterState | null = null;

  save(state: TeacherListFilterState): void {
    this.state = { ...state };
  }

  get(): TeacherListFilterState | null {
    return this.state ? { ...this.state } : null;
  }

  clear(): void {
    this.state = null;
  }
}