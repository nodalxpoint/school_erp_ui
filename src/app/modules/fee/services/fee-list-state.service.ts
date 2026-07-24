import { Injectable } from '@angular/core';

export interface FeeListFilterState {
  academicSessionId: string;
  classId: string;
  sectionId: string;
  paymentStatus: string;
  feeMonth: number | undefined;
  feeYear: number | undefined;
  page: number;
  size: number;
  studentSearchQuery: string;
  selectedStudent: any | null;
}

/**
 * Holds the fee-list's filter + pagination + selected-student state in
 * memory for the lifetime of the app (providedIn: 'root' = one instance
 * for the whole SPA).
 *
 * FeeListComponent restores this on ngOnInit so navigating to add/edit and
 * coming back keeps the same filters + page + selected student. It only
 * resets when the user explicitly hits "Clear".
 */
@Injectable({ providedIn: 'root' })
export class FeeListStateService {
  private state: FeeListFilterState | null = null;

  save(state: FeeListFilterState): void {
    this.state = { ...state };
  }

  get(): FeeListFilterState | null {
    return this.state ? { ...this.state } : null;
  }

  clear(): void {
    this.state = null;
  }
}