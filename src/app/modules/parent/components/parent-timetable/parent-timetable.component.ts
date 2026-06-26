import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../services/parent.service';
import { ChildStudentDto } from '../../models/parent.model';

@Component({
  selector: 'app-parent-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-timetable.component.html',
  styleUrls: ['./parent-timetable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentTimetableComponent implements OnInit {
  childrenList: ChildStudentDto[] = [];
  selectedChildId = '';
  selectedChildObj: ChildStudentDto | null = null;

  isLoading = false;
  selectedDay = 'MON'; // Default selection token
  allTimetableData: any[] = [];
  filteredPeriods: any[] = [];

  daysList = [
    { value: 'MON', label: 'Mon' },
    { value: 'TUE', label: 'Tue' },
    { value: 'WED', label: 'Wed' },
    { value: 'THU', label: 'Thu' },
    { value: 'FRI', label: 'Fri' },
    { value: 'SAT', label: 'Sat' }
  ];

  constructor(private parentService: ParentService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Shuruat me 'MON' default rakhna zyada safe hai agar data sirf weekdays ka ho,
    // ya fir system day track karein:
    const systemDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const calculatedDay = systemDays[new Date().getDay()];
    
    // Agar aaj data nahi hai (Saturday/Sunday), toh 'MON' par toggle karo taaki parent ko blank screen na dikhe
    this.selectedDay = (calculatedDay === 'SUN' || calculatedDay === 'SAT') ? 'MON' : calculatedDay; 

    this.loadChildrenAndSync();
  }

  loadChildrenAndSync(): void {
    this.parentService.getChildrenRegistry().subscribe({
      next: (data) => {
        this.childrenList = data;
        const cached = this.parentService.getActiveChildValue();
        
        if (cached && this.childrenList.some(c => c.id === cached.id)) {
          this.selectedChildId = cached.id;
          this.selectedChildObj = cached;
        } else if (this.childrenList.length > 0) {
          this.selectedChildId = this.childrenList[0].id;
          this.selectedChildObj = this.childrenList[0];
          this.parentService.setActiveChild(this.childrenList[0]);
        }
        
        this.fetchTimetableRegistry();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  onChildChange(): void {
    this.selectedChildObj = this.childrenList.find(c => c.id === this.selectedChildId) || null;
    if (this.selectedChildObj) {
      this.parentService.setActiveChild(this.selectedChildObj);
    }
    this.fetchTimetableRegistry();
  }

  selectDay(dayToken: string): void {
    this.selectedDay = dayToken;
    this.filterPeriodsByDay();
  }

  fetchTimetableRegistry(): void {
    if (!this.selectedChildObj?.classId || !this.selectedChildObj?.sectionId) return;
    
    this.isLoading = true;
    this.allTimetableData = [];
    this.filteredPeriods = [];
    this.cdr.markForCheck();

    this.parentService.getChildTimetable(this.selectedChildObj.classId, this.selectedChildObj.sectionId).subscribe({
      next: (res) => {
        // Handle both wrap patterns safely (envelope data list array or raw list array)
        let serverArray = [];
        if (res && Array.isArray(res)) {
          serverArray = res;
        } else if (res && Array.isArray(res.data)) {
          serverArray = res.data;
        }

        this.allTimetableData = serverArray;
        this.filterPeriodsByDay();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterPeriodsByDay(): void {
    if (!this.allTimetableData || this.allTimetableData.length === 0) {
      this.filteredPeriods = [];
      this.cdr.markForCheck();
      return;
    }

    // 1. Filter elements by dayOfWeek string safely mapping 'MON' to 'MONDAY'
    const matchedItems = this.allTimetableData.filter(p => {
      const dayTarget = (p.dayOfWeek || p.day || '').toUpperCase().trim();
      return dayTarget === this.selectedDay || dayTarget === `${this.selectedDay}DAY`;
    });

    // 2. Sorting via period sequence ascending (Period 1 -> Period 2...)
    matchedItems.sort((a, b) => (a.period || 0) - (b.period || 0));

    // 3. Structural mapping directly targeting the verified JSON response keys
    this.filteredPeriods = matchedItems.map(item => {
      const formatTime = (timeStr: string) => {
        if (!timeStr) return '00:00';
        const parts = timeStr.split(':');
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr; // Remove seconds component safely
      };

      return {
        id: item.id,
        subjectName: item.subjectName || 'General Session',
        teacherName: item.teacherName || 'No Lecturer Assigned',
        roomNo: item.roomNo || 'N/A',
        startTime: formatTime(item.startTime),
        endTime: formatTime(item.endTime),
        isSubstitute: item.isSubstitute === true || item.status === 'SUBSTITUTE',
        isBreak: item.isBreak === true || item.type === 'BREAK'
      };
    });

    // Explicit manual state render execution
    this.cdr.markForCheck(); 
  }

  getSubjectColor(subject: string): string {
    if (!subject) return '#a1a1a6';
    const colors = ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff453a', '#5856d6', '#64d2ff'];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}