import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherTimetableService, ParamDropdownOption } from '../../services/teacher-timetable.service';
import { TimetableDto } from '../../../timetable/models/timetable.model';

@Component({
  selector: 'app-teacher-timetable-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-timetable-form.component.html',
  styleUrls: ['./teacher-timetable-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherTimetableFormComponent implements OnInit {
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
    private timetableService: TeacherTimetableService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
      this.checkEditModeAndPopulate();
      this.cdr.markForCheck(); 
    });
  }

  checkEditModeAndPopulate(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['timetable']) {
        const data = navigation.extras.state['timetable'];
        this.populateFormFields(data);
      }
    }
  }

  populateFormFields(data: TimetableDto): void {
    this.formModel = { ...data };
    
    // Time split compliance "HH:mm" conversion layer fix
    if (this.formModel.startTime && this.formModel.startTime.length > 5) {
      this.formModel.startTime = this.formModel.startTime.substring(0, 5);
    }
    if (this.formModel.endTime && this.formModel.endTime.length > 5) {
      this.formModel.endTime = this.formModel.endTime.substring(0, 5);
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
    this.formModel.sectionId = '';
    this.sections = [];
    if (this.formModel.classId) {
      this.timetableService.getSectionOptions(this.formModel.classId).subscribe(data => {
        this.sections = data;
        this.cdr.markForCheck();
      });
    }
  }

 onSubmit(): void {
  // Payload ka ek safe copy banao submit karne ke liye
  const payload = { ...this.formModel };

  // Agar time me seconds nahi hain (length sirf 5 hai jaise "10:30"), toh ":00" add karo
  if (payload.startTime && payload.startTime.length === 5) {
    payload.startTime = payload.startTime + ':00';
  }
  if (payload.endTime && payload.endTime.length === 5) {
    payload.endTime = payload.endTime + ':00';
  }

  this.isSaving = true;
  this.timetableService.addOrUpdateTimetable(payload).subscribe({
    next: () => {
      this.isSaving = false;
      this.router.navigate(['/teacher-timetable']);
    },
    error: () => {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  });
}

  onCancel(): void {
    this.router.navigate(['/teacher-timetable']);
  }
}