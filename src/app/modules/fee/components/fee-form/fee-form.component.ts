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
  feeStructures: DropdownOption[] = [];
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
    feeStructureId: '',
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

  classes: DropdownOption[] = [];

  ngOnInit(): void {
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      this.cdr.markForCheck();
    });

    this.feeService.getParams('classes').subscribe(data => {
      this.classes = data;
      if (this.selectedStudentObj && this.selectedStudentObj.classId && !this.selectedStudentObj.className) {
        const cls = this.classes.find(c => c.id === this.selectedStudentObj.classId);
        if (cls) {
          this.selectedStudentObj.className = cls.label;
          this.cdr.markForCheck();
        }
      }
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

    // ✅ debounced search pipeline
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
      if (res === null) return;
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
    const existingPaidAmount = data.paidAmount;

    this.formData = {
      id: data.id,
      studentId: data.studentId,
      academicSessionId: data.academicSessionId,
      feeStructureId: data.feeStructureId || '',
      feeMonth: data.feeMonth,
      feeYear: data.feeYear,
      totalAmount: data.totalAmount,
      paidAmount: existingPaidAmount,
      paymentStatus: data.paymentStatus
    };

    const classId = data.classId || data.class_id || (data.student ? data.student.classId : '');
    const matchedClass = this.classes.find(c => c.id === classId);

    this.selectedStudentObj = {
      firstName: data.studentName || 'Student',
      lastName: '',
      id: data.studentId,
      className: data.className || (matchedClass ? matchedClass.label : ''),
      sectionName: data.sectionName || '',
      classId: classId || ''
    };
    this.studentSearchToken = data.studentName || '';

    // Extract first word of studentName for API search (e.g. "neymar junior" -> "neymar")
    const searchToken = data.studentName ? data.studentName.trim().split(' ')[0] : (data.studentId || '');

    if (searchToken) {
      this.feeService.getStudentsList(searchToken).subscribe(students => {
        const match = students.find((s: any) => s.id === data.studentId) || students[0];
        if (match) {
          const resolvedClassId = match.classId || match.classes?.id || classId;
          const resolvedClassName = match.className || match.classes?.className || (this.classes.find(c => c.id === resolvedClassId)?.label) || '';
          const resolvedSectionName = match.sectionName || match.sections?.sectionName || '';

          this.selectedStudentObj = {
            ...this.selectedStudentObj,
            firstName: match.firstName || this.selectedStudentObj.firstName,
            lastName: match.lastName || '',
            className: resolvedClassName || this.selectedStudentObj.className,
            sectionName: resolvedSectionName || this.selectedStudentObj.sectionName,
            classId: resolvedClassId
          };

          if (resolvedClassId) {
            this.loadClassFeeStructures(resolvedClassId, true);
          }
          this.cdr.markForCheck();
        } else if (classId) {
          this.loadClassFeeStructures(classId, true);
        }
      });
    } else if (classId) {
      this.loadClassFeeStructures(classId, true);
    }
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

    const classId = student.classId || student.classes?.id;
    if (classId) {
      this.loadClassFeeStructures(classId);
    } else {
      this.loadClassFeeStructures('');
    }
    this.cdr.markForCheck();
  }

  loadClassFeeStructures(classId: string, keepExistingPaidAmount = false): void {
    if (!classId) {
      this.feeStructures = [];
      this.cdr.markForCheck();
      return;
    }
    this.feeService.getParams('class_fee_structures', classId).subscribe(data => {
      this.feeStructures = data;
      if (this.formData.feeStructureId) {
        this.onFeeStructureChange(keepExistingPaidAmount);
      }
      this.cdr.markForCheck();
    });
  }

  onFeeStructureChange(keepExistingPaidAmount = false): void {
    const selected = this.feeStructures.find(fs => fs.id === this.formData.feeStructureId);
    if (selected && selected.amount != null) {
      this.formData.totalAmount = selected.amount;
      if (!keepExistingPaidAmount || this.formData.paidAmount === undefined || this.formData.paidAmount === null) {
        this.formData.paidAmount = selected.amount;
      }
    }
    this.updatePaymentStatus();
    this.cdr.markForCheck();
  }

  onPaidAmountChange(): void {
    this.updatePaymentStatus();
    this.cdr.markForCheck();
  }

  updatePaymentStatus(): void {
    const paid = Number(this.formData.paidAmount) || 0;
    const total = Number(this.formData.totalAmount) || 0;
    if (paid <= 0) {
      this.formData.paymentStatus = 'PENDING';
    } else if (total > 0 && paid < total) {
      this.formData.paymentStatus = 'PARTIAL';
    } else {
      this.formData.paymentStatus = 'PAID';
    }
  }

  // ✅ naya — agar edit mode me student change karna ho to selection clear karke
  // dobara search box khol sako
  onChangeStudentClick(): void {
    this.selectedStudentObj = null;
    this.formData.studentId = '';
    this.formData.feeStructureId = '';
    this.feeStructures = [];
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
      feeStructureId: this.formData.feeStructureId || undefined,
      feeMonth: this.formData.feeMonth,
      feeYear: this.formData.feeYear,
      totalAmount: this.formData.totalAmount != null ? Number(this.formData.totalAmount) : undefined,
      paidAmount: this.formData.paidAmount != null ? Number(this.formData.paidAmount) : undefined,
      paymentStatus: this.formData.paymentStatus
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
        const errorMessage = err?.error?.message
          || (typeof err?.error === 'string' ? err.error : null)
          || err?.message
          || 'Failed to save fee record. Please try again.';
        this.showToast('error', errorMessage);
      }
    });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.popupType = type;
    this.popupMessage = message;
    this.showResultPopup = true;
    this.cdr.markForCheck();
    this.startPopupTimer(type === 'error' ? 6000 : this.POPUP_DURATION);
  }

  private startPopupTimer(duration: number = this.POPUP_DURATION): void {
    if (this.popupTimer) clearTimeout(this.popupTimer);
    this.popupTimer = setTimeout(() => this.closePopup(), duration);
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