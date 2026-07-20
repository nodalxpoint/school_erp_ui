// src/app/modules/timetable/services/timetable-ui-state.service.ts
//
// Keeps the timetable list's UI state (filters, selected day, search term,
// view mode) alive across navigation. Since it's `providedIn: 'root'`, it's
// a single instance for the whole app lifetime — unlike the component,
// which gets destroyed/recreated every time the route changes (e.g. going
// to /timetable/add and back). That's what makes "wapas aane pe same state"
// work: the component just reads/writes here instead of resetting itself.

import { Injectable } from '@angular/core';
import { TimetableFilterRequest } from '../models/timetable.model';

export interface TimetableUiSnapshot {
  filter: TimetableFilterRequest;
  viewMode: 'weekly' | 'daily';
  selectedDay: string | null;
  searchTerm: string;
}

const DEFAULT_FILTER: TimetableFilterRequest = {
  page: 0, size: 200, sortBy: 'period', sortDirection: 'asc',
  classId: '', sectionId: '', teacherId: '', dayOfWeek: '', academicSessionId: ''
};

@Injectable({ providedIn: 'root' })
export class TimetableUiStateService {
  /** True once the list component has loaded data at least once this app session. */
  private hydrated = false;

  private snapshot: TimetableUiSnapshot = {
    filter: { ...DEFAULT_FILTER },
    viewMode: 'daily',
    selectedDay: null,
    searchTerm: ''
  };

  get hasHydratedState(): boolean {
    return this.hydrated;
  }

  markHydrated(): void {
    this.hydrated = true;
  }

  /** Returns a shallow copy so the component can freely mutate its own local state. */
  getSnapshot(): TimetableUiSnapshot {
    return {
      filter: { ...this.snapshot.filter },
      viewMode: this.snapshot.viewMode,
      selectedDay: this.snapshot.selectedDay,
      searchTerm: this.snapshot.searchTerm
    };
  }

  save(partial: Partial<TimetableUiSnapshot>): void {
    this.snapshot = {
      ...this.snapshot,
      ...partial,
      filter: partial.filter ? { ...partial.filter } : this.snapshot.filter
    };
  }

  /** Call this if you ever want a hard reset (e.g. on logout). */
  reset(): void {
    this.hydrated = false;
    this.snapshot = {
      filter: { ...DEFAULT_FILTER },
      viewMode: 'daily',
      selectedDay: null,
      searchTerm: ''
    };
  }
}