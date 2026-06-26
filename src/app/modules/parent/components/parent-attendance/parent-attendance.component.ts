import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../services/parent.service';
import { ChildStudentDto } from '../../models/parent.model';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-attendance.component.html',
  styleUrls: ['./parent-attendance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentAttendanceComponent implements OnInit {
  childrenList: ChildStudentDto[] = [];
  selectedChildId = '';
  selectedChildObj: ChildStudentDto | null = null;
  
  selectedMonthStr = '2026-06'; 
  selectedStatus = ''; 

  isLoading = false;
  summary = { present: 0, absent: 0, percentage: 0 };
  calendarDays: Array<{ day: number; status: string; dateStr: string } | null> = [];
  
  allMonthLogs: any[] = [];
  recentLogsFeed: any[] = []; 

  monthsList = [
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: '2026-04', label: 'April 2026' },
    { value: '2026-03', label: 'March 2026' }
  ];

  constructor(private parentService: ParentService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Default system month calculation standard
    const current = new Date();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    this.selectedMonthStr = `${current.getFullYear()}-${mm}`;

    this.loadChildrenAndSync();
  }

  loadChildrenAndSync(): void {
    this.parentService.getChildrenRegistry().subscribe(data => {
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
      
      this.fetchAttendanceMetrics();
    });
  }

  onChildChange(): void {
    this.selectedChildObj = this.childrenList.find(c => c.id === this.selectedChildId) || null;
    if (this.selectedChildObj) {
      this.parentService.setActiveChild(this.selectedChildObj);
    }
    this.fetchAttendanceMetrics();
  }

  fetchAttendanceMetrics(): void {
    if (!this.selectedChildId) return;
    this.isLoading = true;
    this.allMonthLogs = [];
    this.recentLogsFeed = [];
    this.calendarDays = [];
    this.cdr.markForCheck();

    const [yearNum, monthNum] = this.selectedMonthStr.split('-').map(Number);

    this.parentService.getAttendanceRegistry(this.selectedChildId, monthNum, yearNum).subscribe({
      next: (serverArray) => {
        // Core list parsing array wrapper checks
        const rawList = Array.isArray(serverArray) ? serverArray : [];
        
        this.allMonthLogs = rawList.map(item => {
          // ✅ FIXED: Parsing direct backend key 'attendanceDate' safely
          const targetDateStr = item.attendanceDate || ''; 
          const dateObj = new Date(targetDateStr);
          
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          let displayDateStr = 'Unknown Date';
          if (targetDateStr && !isNaN(dateObj.getTime())) {
            displayDateStr = `${daysOfWeek[dateObj.getDay()]}, ${dateObj.getDate()} ${monthsNames[dateObj.getMonth()]}`;
          }

          return {
            date: targetDateStr, // standard format string: "2026-06-27"
            displayDate: displayDateStr,
            status: item.status || 'ABSENT', // ✅ FIXED: Mapping direct root level status fields
            remarks: item.remarks || ''
          };
        });

        this.processLogFeeds();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  processLogFeeds(): void {
    // Client-side status filter option matching logic
    const filtered = this.selectedStatus 
      ? this.allMonthLogs.filter(l => l.status === this.selectedStatus)
      : this.allMonthLogs;

    const totalP = this.allMonthLogs.filter(l => l.status === 'PRESENT').length;
    const totalA = this.allMonthLogs.filter(l => l.status === 'ABSENT').length;
    const totalDaysCount = totalP + totalA;
    
    this.summary = {
      present: totalP,
      absent: totalA,
      percentage: totalDaysCount > 0 ? Math.round((totalP / totalDaysCount) * 100) : 0
    };

    // ✅ SLICE: Top 4 to 5 entries safely locked for Recent Activity View
    this.recentLogsFeed = filtered.slice(0, 5);
    
    this.generateCalendarMatrix();
  }

  generateCalendarMatrix(): void {
    const [year, month] = this.selectedMonthStr.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    this.calendarDays = [];

    // Calendar grid offset buffer padding loop
    for (let i = 0; i < firstDayIndex; i++) {
      this.calendarDays.push(null);
    }

    // Checking matches on parsed layout arrays mapping statuses safely
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const matchingLog = this.allMonthLogs.find(l => l.date === dateStr);
      
      this.calendarDays.push({
        day,
        status: matchingLog ? matchingLog.status : 'HOLIDAY',
        dateStr
      });
    }
  }
}