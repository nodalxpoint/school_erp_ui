import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../services/parent.service';
import { ChildStudentDto } from '../../models/parent.model';

@Component({
  selector: 'app-parent-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-exams.component.html',
  styleUrls: ['./parent-exams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentExamsComponent implements OnInit {
  childrenList: ChildStudentDto[] = [];
  selectedChildId = '';
  selectedChildObj: ChildStudentDto | null = null;

  exams: any[] = [];
  selectedExamId = '';

  // Custom dropdown state
  examDropdownOpen = false;

  isLoading = false;
  subjectWiseMarks: any[] = [];

  totalMarksObtained = 0;
  totalMaxMarks = 0;
  overallPercentage = 0;

  constructor(private parentService: ParentService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadChildrenAndSync();
  }

  // Click outside close karne ke liye
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-wrapper')) {
      this.examDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  toggleExamDropdown(): void {
    this.examDropdownOpen = !this.examDropdownOpen;
    this.cdr.markForCheck();
  }

  selectExam(examId: string): void {
    this.selectedExamId = examId;
    this.examDropdownOpen = false;
    this.cdr.markForCheck();
    this.fetchMarksMatrix();
  }

  getSelectedExamLabel(): string {
    if (!this.selectedExamId) return 'Choose active term matrix...';
    const found = this.exams.find(e => e.id === this.selectedExamId);
    return found ? found.examName : 'Choose active term matrix...';
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

      this.loadExamsDropdown();
    });
  }

  onChildChange(): void {
    this.selectedChildObj = this.childrenList.find(c => c.id === this.selectedChildId) || null;
    if (this.selectedChildObj) {
      this.parentService.setActiveChild(this.selectedChildObj);
    }
    this.fetchMarksMatrix();
  }

  loadExamsDropdown(): void {
    this.parentService.getParentExamsList().subscribe(data => {
      this.exams = Array.isArray(data) ? data : [];
      if (this.exams.length > 0) {
        this.selectedExamId = this.exams[0].id;
      }
      this.cdr.markForCheck();
      this.fetchMarksMatrix();
    });
  }

  fetchMarksMatrix(): void {
    if (!this.selectedExamId || !this.selectedChildId) return;

    this.isLoading = true;
    this.subjectWiseMarks = [];
    this.totalMarksObtained = 0;
    this.totalMaxMarks = 0;
    this.overallPercentage = 0;
    this.cdr.markForCheck();

    this.parentService.getParentExamMarks(this.selectedExamId, this.selectedChildId).subscribe({
      next: (resData) => {
        const rawArray = Array.isArray(resData) ? resData : [];
        let runningObtained = 0;
        let runningMax = 0;

        this.subjectWiseMarks = rawArray.map(item => {
          const studentRecord = Array.isArray(item.records)
            ? item.records.find((r: any) => r.studentId === this.selectedChildId)
            : null;

          const obtained = studentRecord ? studentRecord.marksObtained : 0;
          const maxMarks = 100;

          runningObtained += obtained;
          runningMax += maxMarks;

          const percentage = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;

          return {
            subjectName: item.subjectName || 'General Subject',
            marksObtained: obtained,
            maxMarks: maxMarks,
            percentage: percentage,
            grade: this.calculateGrade(percentage)
          };
        });

        this.totalMarksObtained = runningObtained;
        this.totalMaxMarks = runningMax;
        this.overallPercentage = runningMax > 0 ? Math.round((runningObtained / runningMax) * 100) : 0;

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  calculateGrade(percent: number): string {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B+';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C';
    return 'F';
  }

  getSubjectColor(subject: string): string {
    if (!subject) return '#a1a1a6';
    const colors = ['#0a84ff', '#ff453a', '#30d158', '#bf5af2', '#ff9f0a', '#5856d6', '#64d2ff'];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}