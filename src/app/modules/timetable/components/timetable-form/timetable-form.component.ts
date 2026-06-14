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
  ) {}

  ngOnInit(): void {
    // 1. Pehle saare primary dropdown options load karenge
    this.loadDropdownContexts();
  }

  loadDropdownContexts(): void {
    // Parallel context lookups dispatch
    this.timetableService.getOptions('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('teachers').subscribe(data => { this.teachers = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('subjects').subscribe(data => { this.subjects = data; this.cdr.markForCheck(); });
    this.timetableService.getOptions('academic_sessions').subscribe(data => { 
      this.sessions = data; 
      if (!this.isEditMode && this.sessions.length > 0) {
        this.formModel.academicSessionId = this.sessions[0].id;
      }
      
      // Dropdowns sequence load hone ke baad hi Edit parameter check karenge
      this.checkEditModeAndPopulate();
      this.cdr.markForCheck(); 
    });
  }

  checkEditModeAndPopulate(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      
      // Step A: Router state history payload check karenge
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['timetable']) {
        const data = navigation.extras.state['timetable'];
        this.populateFormFields(data);
      } else {
        // Step B: Fallback - Agar router state clear ho gayi (jaise page refresh karne par), 
        // toh filter API use karke dynamic server side query se object nikalenge.
        this.timetableService.filterTimetable({ page: 0, size: 1, classId: undefined }).subscribe({
          next: (res) => {
            // Hum backend se direct specific object track parse kar lenge
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
    
    // ✅ TIME FORMAT COMPOTABILITY FIX: 
    // HTML `<input type="time">` strict format "HH:mm" demand karta hai. 
    // Agar backend se "10:30:00" (with seconds) aa raha hai, toh split karke use "10:30" banayenge.
    if (this.formModel.startTime && this.formModel.startTime.length > 5) {
      this.formModel.startTime = this.formModel.startTime.substring(0, 5);
    }
    if (this.formModel.endTime && this.formModel.endTime.length > 5) {
      this.formModel.endTime = this.formModel.endTime.substring(0, 5);
    }

    // ✅ AUTO-POPULATE SECTIONS: Selected Class ke section dropdown options immediately load karenge
    if (this.formModel.classId) {
      this.loadSectionsForClass(this.formModel.classId);
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