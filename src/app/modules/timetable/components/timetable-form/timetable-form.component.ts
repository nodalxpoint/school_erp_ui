import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TimetableService, ParamDropdownOption } from '../../services/timetable.service';
import { TimetableDto } from '../../models/timetable.model';

@Component({
  selector: 'app-timetable-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timetable-form.component.html',
  styleUrls: ['./timetable-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimetableFormComponent implements OnInit {
  isEditMode = false;
  isSaving = false;

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

  constructor(
    private timetableService: TimetableService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    // ✅ FIX 1: Capture router history state payload instantly inside the constructor before it gets cleared
    const navigation = this.router.getCurrentNavigation();
    const stateData = navigation?.extras.state?.['timetable'] || history.state?.['timetable'];
    
    if (stateData) {
      this.isEditMode = true;
      this.populateFormFields(stateData);
    }
  }

  ngOnInit(): void {
    // Primary master dropdown listings configurations dispatch
    this.loadDropdownContexts();
  }

  loadDropdownContexts(): void {
    this.timetableService.getOptions('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('teachers').subscribe(data => { this.teachers = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('subjects').subscribe(data => { this.subjects = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('academic_sessions').subscribe(data => { 
      this.sessions = data; 
      if (!this.isEditMode && this.sessions.length > 0) {
        this.formModel.academicSessionId = this.sessions[0].id;
      }
      
      // Execute path parsing check fallback parameters safely
      this.checkEditModeAndPopulate();
      this.cdr.markForCheck(); 
    });
  }

  checkEditModeAndPopulate(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      
      // ✅ FIX 2: Fallback query mapping if constructor initialization was skipped due to deep reload links
      if (!this.formModel.classId) {
        this.timetableService.filterTimetable({ page: 0, size: 200 }).subscribe({
          next: (res) => {
            const matchedSlot = res.data?.find(t => t.id === id);
            if (matchedSlot) {
              this.populateFormFields(matchedSlot);
            }
          }
        });
      }
    }
  }

  populateFormFields(data: TimetableDto): void {
    this.formModel = { ...data };
    
    // Input tag tracking formats compatibility check slicers
    if (this.formModel.startTime && this.formModel.startTime.length > 5) {
      this.formModel.startTime = this.formModel.startTime.substring(0, 5);
    }
    if (this.formModel.endTime && this.formModel.endTime.length > 5) {
      this.formModel.endTime = this.formModel.endTime.substring(0, 5);
    }

    // 🔥 IMPORTANT FIX 3: Dynamic child sections must populate instantly based on populated class parameters
    if (this.formModel.classId) {
      this.timetableService.getSectionOptions(this.formModel.classId).subscribe(res => {
        this.sections = res;
        this.cdr.markForCheck(); // Synchronizes dropdown interface flawlessly
      });
    }
    this.cdr.markForCheck();
  }

  onClassChange(): void {
    this.formModel.sectionId = '';
    this.sections = [];
    if (this.formModel.classId) {
      this.loadSectionsForClass(this.formModel.classId);
    }
  }

  loadSectionsForClass(classId: string): void {
    this.timetableService.getSectionOptions(classId).subscribe(data => {
      this.sections = data;
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
    this.isSaving = true;
    this.timetableService.addOrUpdateTimetable(this.formModel).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/timetable']);
      },
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/timetable']);
  }
}