import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../services/parent.service';
import { FeeService } from '../../../fee/services/fee.service';
import { ChildStudentDto } from '../../models/parent.model';
import { DropdownOption } from '../../../student/models/student.model';
import { MonthlyFeeStatusResponse, MonthFeeDetail } from '../../../fee/models/fee.model';

@Component({
  selector: 'app-parent-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-fees.component.html',
  styleUrls: ['./parent-fees.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentFeesComponent implements OnInit {
  childrenList: ChildStudentDto[] = [];
  selectedChildId = '';
  selectedChildObj: ChildStudentDto | null = null;

  sessionsList: DropdownOption[] = [];
  selectedSessionId = '';

  isLoading = false;
  feeStatus: MonthlyFeeStatusResponse | null = null;
  months: MonthFeeDetail[] = [];

  // Summary Metrics
  totalPaid = 0;
  totalPending = 0;
  overallTotal = 0;
  paidPercentage = 0;

  constructor(
    private parentService: ParentService,
    private feeService: FeeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadChildrenAndSessions();
  }

  loadChildrenAndSessions(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Fetch academic sessions first
    this.feeService.getParams('academic_sessions').subscribe(sessions => {
      this.sessionsList = sessions;
      if (sessions.length > 0) {
        this.selectedSessionId = sessions[0].id;
      }

      // Fetch children
      this.parentService.getChildrenRegistry().subscribe(children => {
        this.childrenList = children;

        // Try to sync with cached active child
        const cached = this.parentService.getActiveChildValue();
        if (cached && this.childrenList.some(c => c.id === cached.id)) {
          this.selectedChildId = cached.id;
          this.selectedChildObj = cached;
        } else if (this.childrenList.length > 0) {
          this.selectedChildId = this.childrenList[0].id;
          this.selectedChildObj = this.childrenList[0];
          this.parentService.setActiveChild(this.childrenList[0]);
        }

        this.isLoading = false;
        this.cdr.markForCheck();

        // Fetch fee status if we have both student and session
        this.fetchMonthlyFeeStatus();
      });
    });
  }

  onChildChange(): void {
    this.selectedChildObj = this.childrenList.find(c => c.id === this.selectedChildId) || null;
    if (this.selectedChildObj) {
      this.parentService.setActiveChild(this.selectedChildObj);
    }
    this.fetchMonthlyFeeStatus();
  }

  onSessionChange(): void {
    this.fetchMonthlyFeeStatus();
  }

  fetchMonthlyFeeStatus(): void {
    if (!this.selectedChildId || !this.selectedSessionId) {
      this.feeStatus = null;
      this.months = [];
      this.calculateSummary();
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.feeService.getMonthlyFeeStatus(this.selectedChildId, this.selectedSessionId).subscribe({
      next: (response) => {
        this.feeStatus = response;
        this.months = response?.months ?? [];
        this.calculateSummary();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching monthly fee status:', err);
        this.feeStatus = null;
        this.months = [];
        this.calculateSummary();
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private calculateSummary(): void {
    this.totalPaid = 0;
    this.totalPending = 0;
    this.overallTotal = 0;
    this.paidPercentage = 0;

    if (this.months.length > 0) {
      this.months.forEach(m => {
        this.totalPaid += m.paidAmount || 0;
        const unpaid = (m.totalAmount || 0) - (m.paidAmount || 0);
        this.totalPending += unpaid > 0 ? unpaid : 0;
        this.overallTotal += m.totalAmount || 0;
      });

      if (this.overallTotal > 0) {
        this.paidPercentage = Math.round((this.totalPaid / this.overallTotal) * 100);
      }
    }
  }
}
