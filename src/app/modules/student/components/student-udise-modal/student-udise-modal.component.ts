// src/app/modules/student/components/student-udise-modal/student-udise-modal.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UdiseService } from '../../../udise/services/udise.service';
import { StudentResponseDto } from '../../models/student.model';
import { StudentUdiseResponseDto, SaveStudentUdiseDto } from '../../../udise/models/udise.model';

@Component({
  selector: 'app-student-udise-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-udise-modal.component.html',
  styleUrls: ['./student-udise-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentUdiseModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() student: StudentResponseDto | null = null;
  @Input() udiseId: string | null = null; // can edit by direct udise record id too

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isLoading = false;
  isSaving = false;
  error = '';
  successMsg = '';

  // Form Model
  formData: SaveStudentUdiseDto = this.getInitialFormData();
  existingRecord: StudentUdiseResponseDto | null = null;

  // Tabs for structured layout
  activeTab: 'general' | 'social' | 'disability' | 'schooling' = 'general';

  // Dropdown Options
  statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];
  socialCategoryOptions = ['GENERAL', 'OBC', 'SC', 'ST'];
  minorityOptions = ['NONE', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'ZOROASTRIAN', 'JAIN'];
  disabilityOptions = [
    'NONE',
    'BLINDNESS',
    'LOW_VISION',
    'HEARING_IMPAIRMENT',
    'SPEECH_AND_LANGUAGE',
    'LOCOMOTOR',
    'MENTAL_ILLNESS',
    'AUTISM_SPECTRUM',
    'CEREBRAL_PALSY',
    'MULTIPLE_DISABILITIES'
  ];

  constructor(
    private udiseService: UdiseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      this.loadUdiseData();
    }
  }

  getInitialFormData(): SaveStudentUdiseDto {
    return {
      id: undefined,
      studentId: '',
      academicSessionId: '',
      pen: '',
      apaarId: '',
      aadhaarLastFour: '',
      nameAsPerAadhaar: '',
      pincode: '',
      udiseStatus: 'PENDING',
      motherTongue: 'Hindi',
      socialCategory: 'GENERAL',
      minorityGroup: 'NONE',
      bplBeneficiary: false,
      ewsDisadvantaged: false,
      indianNational: true,
      cwsn: false,
      disabilityType: 'NONE',
      outOfSchoolCurrentYear: false,
      outOfSchoolPreviousYear: false
    };
  }

  resetForm(): void {
    this.formData = this.getInitialFormData();
    this.existingRecord = null;
    this.error = '';
    this.successMsg = '';
    this.activeTab = 'general';
  }

  loadUdiseData(): void {
    const studentId = this.student?.id;
    const academicSessionId = this.student?.academicSessionId;

    if (!studentId && !this.udiseId) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // Setup basic fields from student context in case we're creating new
    if (studentId) {
      this.formData.studentId = studentId;
    }
    if (academicSessionId) {
      this.formData.academicSessionId = academicSessionId;
    }

    // Determine query request
    const req = this.udiseId 
      ? { page: 0, size: 1, sortBy: 'createdAt', sortDirection: 'DESC' as const, id: this.udiseId }
      : { page: 0, size: 1, sortBy: 'createdAt', sortDirection: 'DESC' as const, studentId };

    this.udiseService.filterUdise(req).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          const rec = res.data[0];
          this.existingRecord = rec;
          this.formData = {
            id: rec.id,
            studentId: rec.studentId,
            academicSessionId: rec.academicSessionId,
            pen: rec.pen || '',
            apaarId: rec.apaarId || '',
            aadhaarLastFour: rec.aadhaarLastFour || '',
            nameAsPerAadhaar: rec.nameAsPerAadhaar || '',
            pincode: rec.pincode || '',
            udiseStatus: rec.udiseStatus || 'PENDING',
            motherTongue: rec.motherTongue || 'Hindi',
            socialCategory: rec.socialCategory || 'GENERAL',
            minorityGroup: rec.minorityGroup || 'NONE',
            bplBeneficiary: rec.bplBeneficiary,
            ewsDisadvantaged: rec.ewsDisadvantaged,
            indianNational: rec.indianNational,
            cwsn: rec.cwsn,
            disabilityType: rec.disabilityType || 'NONE',
            outOfSchoolCurrentYear: rec.outOfSchoolCurrentYear,
            outOfSchoolPreviousYear: rec.outOfSchoolPreviousYear
          };
        } else {
          // If editing by UDISE ID and not found
          if (this.udiseId) {
            this.error = 'UDISE record not found.';
          }
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading UDISE details:', err);
        this.error = 'Failed to load existing UDISE details.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setTab(tab: 'general' | 'social' | 'disability' | 'schooling'): void {
    this.activeTab = tab;
  }

  onSaveSubmit(): void {
    if (!this.formData.studentId || !this.formData.academicSessionId) {
      this.error = 'Student and Academic Session references are required.';
      return;
    }

    if (this.formData.aadhaarLastFour && this.formData.aadhaarLastFour.length !== 4) {
      this.error = 'Aadhaar digits must be exactly 4 numbers.';
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.successMsg = '';
    this.cdr.markForCheck();

    // Adjust disabilityType if not CWSN
    if (!this.formData.cwsn) {
      this.formData.disabilityType = 'NONE';
    }

    this.udiseService.addOrUpdateUdise(this.formData).subscribe({
      next: (res) => {
        this.successMsg = 'UDISE details saved successfully!';
        this.isSaving = false;
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.saved.emit();
          this.closeModal();
        }, 1200);
      },
      error: (err) => {
        console.error('Error saving UDISE details:', err);
        this.error = err.error?.message || 'Failed to save UDISE details. Please verify fields and try again.';
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeModal(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}
