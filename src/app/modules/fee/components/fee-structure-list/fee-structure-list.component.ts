import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeeService } from '../../services/fee.service';
import { FeeStructureDto, FeeStructureFilterRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

const FS_STATE_KEY = 'fs_fee_structure_state_v1';

interface PersistedFsState {
  academicSessionId: string;
  classId: string;
  frequency: string;
}

@Component({
  selector: 'app-fee-structure-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-structure-list.component.html',
  styleUrls: ['./fee-structure-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeeStructureListComponent implements OnInit {
  structures: FeeStructureDto[] = [];
  loading = false;
  classes: DropdownOption[] = [];
  sessions: DropdownOption[] = [];

  // ✅ naya — sessionStorage se restore hone tak yahi hold rakhta hai
  private restoredFilter: Partial<PersistedFsState> = {};

  filters: FeeStructureFilterRequest = {
    page: 0,
    size: 20,
    sortBy: 'classes.className',
    sortDirection: 'ASC',
    classId: '',
    feeName: '',
    frequency: '',
    academicSessionId: ''
  };

  constructor(
    private feeService: FeeService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreState();

    this.feeService.getParams('classes').subscribe(data => {
      this.classes = data;

      const restoredClassValid = !!this.restoredFilter.classId &&
        this.classes.some(c => c.id === this.restoredFilter.classId);
      if (restoredClassValid) {
        this.filters.classId = this.restoredFilter.classId!;
      }

      this.cdr.markForCheck();
    });

    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;

      if (this.sessions.length > 0) {
        const restoredSessionValid = !!this.restoredFilter.academicSessionId &&
          this.sessions.some(s => s.id === this.restoredFilter.academicSessionId);

        this.filters.academicSessionId = restoredSessionValid
          ? this.restoredFilter.academicSessionId!
          : this.sessions[0].id;
      }

      if (this.restoredFilter.frequency) {
        this.filters.frequency = this.restoredFilter.frequency;
      }

      this.onSearch();
      this.cdr.markForCheck();
    });
  }

  // ─── State persistence: session/class/frequency yaad rehta hai
  // jab tum doosre page pe jaake wapas is list pe aate ho ────────
  private restoreState(): void {
    try {
      const raw = sessionStorage.getItem(FS_STATE_KEY);
      if (!raw) return;
      this.restoredFilter = JSON.parse(raw) as PersistedFsState;
    } catch {
      // corrupt/inaccessible storage — silently ignore, defaults apply
    }
  }

  private persistState(): void {
    try {
      const toSave: PersistedFsState = {
        academicSessionId: this.filters.academicSessionId || '',
        classId: this.filters.classId || '',
        frequency: this.filters.frequency || ''
      };
      sessionStorage.setItem(FS_STATE_KEY, JSON.stringify(toSave));
    } catch {
      // storage unavailable — non-fatal, just won't persist
    }
  }

  onSearch(): void {
    this.loading = true;
    const payload: any = {
      page: this.filters.page,
      size: this.filters.size,
      sortBy: this.filters.sortBy,
      sortDirection: this.filters.sortDirection
    };
    if (this.filters.classId) payload.classId = this.filters.classId;
    if (this.filters.frequency) payload.frequency = this.filters.frequency;
    if (this.filters.academicSessionId) payload.academicSessionId = this.filters.academicSessionId;

    this.feeService.filterFeeStructures(payload).subscribe({
      next: (res: any) => {
        const rawData = res.data?.data ?? [];
        this.structures = this.sortStructuresByClass(rawData);
        this.loading = false;
        this.persistState();
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private sortStructuresByClass(structures: FeeStructureDto[]): FeeStructureDto[] {
    const parseClassOrder = (name: string): number => {
      if (!name) return 999;
      const normalized = name.toLowerCase().trim();
      
      if (normalized.includes('nursery')) return -4;
      if (normalized.includes('play')) return -3;
      if (normalized.includes('lkg') || normalized.includes('l.k.g')) return -2;
      if (normalized.includes('ukg') || normalized.includes('u.k.g')) return -1;
      
      const match = normalized.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
      
      const romanMapping: { [key: string]: number } = {
        'xii': 12, 'xi': 11, 'x': 10, 'ix': 9, 'viii': 8, 'vii': 7, 'vi': 6, 'v': 5, 'iv': 4, 'iii': 3, 'ii': 2, 'i': 1
      };
      
      const words = normalized.split(/[\s-]+/);
      for (const word of words) {
        if (romanMapping[word] !== undefined) {
          return romanMapping[word];
        }
      }
      
      return 100;
    };

    return [...structures].sort((a, b) => {
      const nameA = a.className || '';
      const nameB = b.className || '';
      
      const orderA = parseClassOrder(nameA);
      const orderB = parseClassOrder(nameB);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  clearFilters(): void {
    this.filters = {
      page: 0,
      size: 20,
      sortBy: 'classes.className',
      sortDirection: 'ASC',
      classId: '',
      feeName: '',
      frequency: '',
      academicSessionId: this.sessions.length > 0 ? this.sessions[0].id : ''
    };
    this.onSearch();
  }

  openForm(row?: FeeStructureDto): void {
    if (row) {
      this.router.navigate(['../edit', row.id], { relativeTo: this.route, state: { data: row } });
    } else {
      this.router.navigate(['../add'], { relativeTo: this.route });
    }
  }

  frequencyLabel(freq: string): string {
    const map: Record<string, string> = {
      MONTHLY: 'Monthly', QUARTERLY: 'Quarterly',
      ANNUALLY: 'Annually', ONE_TIME: 'One Time'
    };
    return map[freq] || freq;
  }
}