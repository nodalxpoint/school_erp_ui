// core/auth/current-school.service.ts — single place to read the logged-in user's school

import { Injectable } from '@angular/core';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class CurrentSchoolService {
  constructor(private authState: AuthStateService) {}

  get schoolId(): string {
    return this.authState.currentUser?.schoolId ?? '';
  }
}
