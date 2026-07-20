import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError, map } from 'rxjs/operators';
import { FeeService } from '../../services/fee.service';
import { SaveFeeRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

@Component({
  selector: 'app-fee-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-form.component.html',
  styleUrls: ['./fee-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeeFormComponent implements OnInit, OnDestroy {
  sessions: DropdownOption[] = [];
  isEditMode = false;
  isLoading = false;

  studentSearchToken = '';
  dynamicStudentsList: any[] = [];
  showSuggestions = false;
  selectedStudentObj: any | null = null;
  isSearchingStudents = false;

  // ✅ naya — debounced student search: har keystroke pe API call nahi jaati,
  // typing rukne ke ~350ms baad hi search fire hoti hai
  private searchTerms$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ✅ naya — submit try karne ke baad hi red validation errors dikhengi
  submitted = false;

  formData: SaveFeeRequest = {
    studentId: '',
    academicSessionId: '',
    feeMonth: new Date().getMonth() + 1,
    feeYear: new Date().getFullYear()
  };

  // ✅ naya — toast popup ke liye
  showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;

  constructor(
    private feeService: FeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      this.cdr.markForCheck();
    });

    const editId = this.route.snapshot.paramMap.get('id');
    const stateData = history.state?.data;

    if (editId || stateData) {
      this.isEditMode = true;
      if (stateData) {
        this.mapIncomingEditForm(stateData);
      } else if (editId) {
        this.formData.id = editId;
      }
    }

    // ✅ naya — debounced search pipeline: 350ms tak typing rukne ka wait,
    // fir wahi text dobara na ho (distinctUntilChanged), fir switchMap se
    // purani pending request cancel karke nayi bhejo
    this.searchTerms$.pipe(
      map(term => term.trim()),
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          this.dynamicStudentsList = [];
          this.showSuggestions = false;
          this.isSearchingStudents = false;
          this.cdr.markForCheck();
          return of(null);
        }
        this.isSearchingStudents = true;
        this.cdr.markForCheck();
        return this.feeService.getStudentsList(term).pipe(
          catchError(() => of([]))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      if (res === null) return; // short/empty term already handled above
      this.dynamicStudentsList = res;
      this.showSuggestions = true;
      this.isSearchingStudents = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  mapIncomingEditForm(data: any): void {
    this.formData = {
      id: data.id,
      studentId: data.studentId,
      academicSessionId: data.academicSessionId,
      feeMonth: data.feeMonth,
      feeYear: data.feeYear
    };

    this.selectedStudentObj = {
      firstName: data.studentName || 'Student',
      lastName: '',
      id: data.studentId,
      className: data.className || '',
      sectionName: data.sectionName || ''
    };
    this.studentSearchToken = data.studentName || '';
  }

  onStudentSearchInput(): void {
    // ✅ naya — user dobara type kare to purani selection clear karo taaki
    // wo confusion na ho ki abhi kaun sa student actually selected hai
    if (this.selectedStudentObj) {
      this.selectedStudentObj = null;
      this.formData.studentId = '';
    }

    // ✅ naya — seedha API call nahi, debounce stream me daal do
    this.searchTerms$.next(this.studentSearchToken);
  }

  // Manual "Search" button click — turant search karo, debounce ka wait nahi
  triggerSearchQuery(): void {
    const term = this.studentSearchToken.trim();
    if (term.length < 2) {
      this.dynamicStudentsList = [];
      this.showSuggestions = false;
      return;
    }
    this.isSearchingStudents = true;
    this.cdr.markForCheck();
    this.feeService.getStudentsList(term).subscribe({
      next: (res) => {
        this.dynamicStudentsList = res;
        this.showSuggestions = true;
        this.isSearchingStudents = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSearchingStudents = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectActiveStudent(student: any): void {
    this.selectedStudentObj = student;
    this.formData.studentId = student.id;
    this.studentSearchToken = `${student.firstName} ${student.lastName}`;
    this.showSuggestions = false;
    this.dynamicStudentsList = [];
    this.cdr.markForCheck();
  }

  // ✅ naya — agar edit mode me student change karna ho to selection clear karke
  // dobara search box khol sako
  onChangeStudentClick(): void {
    this.selectedStudentObj = null;
    this.formData.studentId = '';
    this.studentSearchToken = '';
    this.dynamicStudentsList = [];
    this.showSuggestions = false;
    this.cdr.markForCheck();
  }

  // ✅ fix — relative navigation ('../list') route structure ke hisaab se
  // kabhi-kabhi resolve nahi hoti thi (back/cancel button "kaam nahi karta"
  // wali complaint isi wajah se thi). Baaki saare forms ki tarah absolute
  // path use karo — hamesha reliably kaam karega.
  onCancel(): void {
    this.router.navigate(['/fees/list']);
  }

  onSaveSubmit(): void {
    this.submitted = true;
    this.cdr.markForCheck();

    if (!this.formData.studentId || !this.formData.academicSessionId) {
      this.showToast('error', 'Please select a student and an academic session.');
      return;
    }
    if (!this.formData.feeMonth || !this.formData.feeYear) {
      this.showToast('error', 'Fee month and year are required.');
      return;
    }

    const payload: SaveFeeRequest = {
      studentId: this.formData.studentId,
      academicSessionId: this.formData.academicSessionId,
      feeMonth: this.formData.feeMonth,
      feeYear: this.formData.feeYear
    };

    if (this.formData.id) payload.id = this.formData.id;

    this.isLoading = true;
    this.cdr.markForCheck();

    // ✅ same saveFee API create aur edit dono ke liye — payload me id
    // hone/na hone se hi backend decide karta hai, isliye alag se koi
    // edit-specific API call ki zaroorat nahi hai (jaisa expect kiya gaya)
    this.feeService.saveFee(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.showToast('success', res?.message || (this.isEditMode ? 'Fee record updated successfully!' : 'Fee entry created successfully!'));
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showToast('error', err?.error?.message || 'Failed to save fee record. Please try again.');
      }
    });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.popupType = type;
    this.popupMessage = message;
    this.showResultPopup = true;
    this.cdr.markForCheck();
    this.startPopupTimer();
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
      this.router.navigate(['/fees/list']);
    }
  }
}