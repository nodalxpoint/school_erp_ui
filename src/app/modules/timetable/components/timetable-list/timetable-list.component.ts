import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimetableDto, TimetableFilterRequest } from '../../models/timetable.model';
import { TimetableService, ParamDropdownOption } from '../../services/timetable.service';

@Component({
  selector: 'app-timetable-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timetable-list.component.html',
  styleUrls: ['./timetable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimetableListComponent implements OnInit {
  timetables: TimetableDto[] = [];
  isLoading = false;

  // UI state
  viewMode: 'weekly' | 'daily' = 'weekly';

  // Dropdown data references
  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  teachers: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  // Matrix Structural Layout
  daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  periodsList = [1, 2, 3, 4, 5, 6, 7, 8];

  // Default Filter State
  filter: TimetableFilterRequest = {
    page: 0, size: 200, sortBy: 'period', sortDirection: 'asc',
    classId: '', sectionId: '', teacherId: '', dayOfWeek: ''
  };

  constructor(
    private timetableService: TimetableService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialMatrixConfigurations();
  }

  loadInitialMatrixConfigurations(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.timetableService.getOptions('academic_sessions').subscribe(data => {
      this.sessions = data;
      this.cdr.markForCheck();
    });

    this.timetableService.getOptions('classes').subscribe({
      next: (classList) => {
        this.classes = classList;

        if (this.classes.length > 0) {
          this.filter.classId = this.classes[0].id;

          this.timetableService.getSectionOptions(this.filter.classId).subscribe({
            next: (sectionList) => {
              this.sections = sectionList;
              if (this.sections.length > 0) {
                this.filter.sectionId = this.sections[0].id;
              }
              this.loadTimetables();
            },
            error: () => { this.isLoading = false; this.cdr.markForCheck(); }
          });
        } else {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  loadTimetables(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const cleanFilter: any = { ...this.filter };
    Object.keys(cleanFilter).forEach(key => {
      if (cleanFilter[key] === '') cleanFilter[key] = undefined;
    });

    this.timetableService.filterTimetable(cleanFilter).subscribe({
      next: (res) => {
        this.timetables = res.data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getSlotData(day: string, periodNum: number): TimetableDto | undefined {
    return this.timetables.find(t => t.dayOfWeek === day && t.period === periodNum);
  }

  onClassChangeChange(): void {
    this.filter.sectionId = '';
    this.sections = [];
    this.timetables = [];
    if (this.filter.classId) {
      this.timetableService.getSectionOptions(this.filter.classId).subscribe(data => {
        this.sections = data;
        if (this.sections.length > 0) {
          this.filter.sectionId = this.sections[0].id;
        }
        this.loadTimetables();
      });
    }
  }

  onAddTimetable(): void {
    this.router.navigate(['/timetable/add']);
  }

  onEditTimetable(item: TimetableDto): void {
    this.router.navigate(['/timetable', item.id, 'edit'], {
      state: { timetable: item }
    });
  }
}