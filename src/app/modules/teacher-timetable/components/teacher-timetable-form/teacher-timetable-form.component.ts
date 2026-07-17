// src/app/modules/teacher-timetable/components/teacher-timetable-form/teacher-timetable-form.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherTimetableService, ParamDropdownOption } from '../../services/teacher-timetable.service';
import { TimetableDto } from '../../../timetable/models/timetable.model';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-timetable-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-timetable-form.component.html',
  styleUrls: ['./teacher-timetable-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherTimetableFormComponent implements OnInit, OnDestroy {
  isEditMode = false;
  isSaving = false;
  
  // Privilege Access Controls
  isAdmin = false;
  realTeacherIdFromBackend = ''; // 🔥 Holds genuine database Teacher UUID
  loggedInTeacherName = ''; 
  private destroy$ = new Subject<void>();

  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  teachers: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];
  daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  formModel: TimetableDto = {
    academicSessionId: '', classId: '', sectionId: '',
    subjectId: '', teacherId: '', period: 1,
    dayOfWeek: 'MONDAY', startTime: '', endTime: '', roomNo: ''
  };

    showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

  constructor(
    private timetableService: TeacherTimetableService,
    private authState: AuthStateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkUserRoleContext();
    this.loadDropdownContexts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkUserRoleContext(): void {
    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
          
          if (user.role === 'TEACHER') {
            this.loggedInTeacherName = user.name || 'Assigned Faculty Member';
            
            // 🔥 FIX 1: Load myClass to fetch the actual valid teacherId from your response object
            this.timetableService.getMyClassDetails().subscribe(res => {
              if (res.success && res.data) {
                this.realTeacherIdFromBackend = res.data.teacherId;
                
                // If adding new item, inject valid teacher token straight away
                if (!this.isEditMode) {
                  this.formModel.teacherId = res.data.teacherId;
                  this.formModel.classId = res.data.classId;
                  this.formModel.sectionId = res.data.sectionId;
                  this.onClassChange(); // Auto load section list
                }
                this.cdr.markForCheck();
              }
            });
          }
        }
        this.cdr.markForCheck();
      });
  }

  loadDropdownContexts(): void {
    this.timetableService.getOptions('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('subjects').subscribe(data => { this.subjects = data; this.cdr.markForCheck(); });
    
    this.timetableService.getOptions('teachers').subscribe(data => { 
      this.teachers = data; 
      this.syncTeacherIdPayload();
      this.cdr.markForCheck(); 
    });

    this.timetableService.getOptions('academic_sessions').subscribe(data => { 
      this.sessions = data; 
      if (!this.isEditMode && this.sessions.length > 0) {
        this.formModel.academicSessionId = this.sessions[0].id;
      }
      this.checkEditModeAndPopulate();
      this.cdr.markForCheck(); 
    });
  }

  private syncTeacherIdPayload(): void {
    if (!this.isAdmin && this.realTeacherIdFromBackend) {
      this.formModel.teacherId = this.realTeacherIdFromBackend;
    }
  }

  checkEditModeAndPopulate(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['timetable']) {
        const data = navigation.extras.state['timetable'];
        this.populateFormFields(data);
      } else {
        this.timetableService.filterTeacherTimetable({ page: 0, size: 200 }).subscribe({
          next: (res) => {
            const matchedSlot = res.data?.find(t => t.id === id);
            if (matchedSlot) {
              this.populateFormFields(matchedSlot);
            }
          }
        });
      }
    } else {
      // 🔥 NEW: Pre-fill day & period when navigating from an empty cell click
      const navigation = this.router.getCurrentNavigation();
      const prefill = navigation?.extras.state?.['prefill'];
      if (prefill) {
        if (prefill.dayOfWeek) this.formModel.dayOfWeek = prefill.dayOfWeek;
        if (prefill.period)    this.formModel.period    = prefill.period;
        this.cdr.markForCheck();
      }
    }
  }

  populateFormFields(data: TimetableDto): void {
    this.formModel = { ...data };
    
    if (this.formModel.startTime && this.formModel.startTime.length > 5) {
      this.formModel.startTime = this.formModel.startTime.substring(0, 5);
    }
    if (this.formModel.endTime && this.formModel.endTime.length > 5) {
      this.formModel.endTime = this.formModel.endTime.substring(0, 5);
    }

    // 🔥 FIX 2: If teacher edits, overwrite with genuine database teacherId token
    if (!this.isAdmin && this.realTeacherIdFromBackend) {
      this.formModel.teacherId = this.realTeacherIdFromBackend;
    }

    if (this.formModel.teacherName) {
      this.loggedInTeacherName = this.formModel.teacherName;
    }

    if (this.formModel.classId) {
      this.timetableService.getSectionOptions(this.formModel.classId).subscribe(res => {
        this.sections = res;
        this.cdr.markForCheck();
      });
    }
    this.cdr.markForCheck();
  }

  onClassChange(): void {
    this.sections = [];
    if (this.formModel.classId) {
      this.timetableService.getSectionOptions(this.formModel.classId).subscribe(data => {
        this.sections = data;
        this.cdr.markForCheck();
      });
    }
  }

onSubmit(): void {
  const payload = { ...this.formModel };

  if (!this.isAdmin && this.realTeacherIdFromBackend) {
    payload.teacherId = this.realTeacherIdFromBackend;
  }

  if (payload.startTime && payload.startTime.length === 5) {
    payload.startTime = payload.startTime + ':00';
  }
  if (payload.endTime && payload.endTime.length === 5) {
    payload.endTime = payload.endTime + ':00';
  }

  this.isSaving = true;
  this.cdr.markForCheck();

  this.timetableService.addOrUpdateTimetable(payload).subscribe({
    next: (res: any) => {
      this.isSaving = false;

      this.popupType = 'success';
      this.popupMessage = res?.message || (this.isEditMode ? 'Timetable slot updated successfully!' : 'Timetable slot created successfully!');
      this.showResultPopup = true;
      this.cdr.markForCheck();
      this.startPopupTimer();
    },
    error: (err: any) => {
      this.isSaving = false;

      this.popupType = 'error';
      this.popupMessage = err?.error?.message || 'Failed to save timetable slot. Please try again.';
      this.showResultPopup = true;
      this.cdr.markForCheck();
      this.startPopupTimer();
    }
  });
}

private startPopupTimer(): void {
  if (this.popupTimer) clearTimeout(this.popupTimer);
  this.popupTimer = setTimeout(() => this.closePopup(), this.POPUP_DURATION);
}

closePopup(): void {
  if (this.popupTimer) { clearTimeout(this.popupTimer); this.popupTimer = null; }
  const wasSuccess = this.popupType === 'success';
  this.showResultPopup = false;
  this.cdr.markForCheck();
  if (wasSuccess) {
    this.router.navigate(['/teacher-timetable']);
  }
}

  onCancel(): void {
    this.router.navigate(['/teacher-timetable']);
  }
}