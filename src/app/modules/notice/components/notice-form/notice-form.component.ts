import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { HttpService } from '../../../../core/services/http.service';
import { NoticeService } from '../../service/notice.service';
import { NoticeDto, NoticeUpsertRequest } from '../../models/notice.model';

@Component({
  selector: 'app-notice-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notice-form.component.html',
  styleUrls: ['./notice-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoticeFormComponent implements OnInit {
  isEditMode = false;
  isSaving = false;

  formId: string | null = null;
  formTitle = '';
  formDescription = '';
  formPublishDate = '';
  formExpiryDate = '';

  // teacher ki apni class (auto, no dropdown) — "my class" API se aayegi
  teacherClassId: string | null = null;
  teacherSectionId: string | null = null;
  teacherClassName = '';
  isLoadingTeacherClass = false;

  private academicSessionId: string | null = null;

  toast: { type: 'success' | 'error'; message: string } | null = null;
  private toastTimeoutId: any = null;

  constructor(
    public authState: AuthStateService,
    private noticeService: NoticeService,
    private http: HttpService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAcademicSession();

    if (this.isTeacher) {
      this.loadTeacherClass();
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.formId = id;

      const navNotice = (this.router.getCurrentNavigation()?.extras.state?.['notice'])
        ?? (history.state?.notice);

      if (navNotice) {
        this.patchForm(navNotice as NoticeDto);
      } else {
        console.warn('Notice data navigation state me nahi mili — list se edit open karo.');
      }
    }
  }

  get currentUser() { return this.authState.currentUser; }
  get isAdmin(): boolean {
    const r = this.currentUser?.role;
    return r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'SCHOOL_ADMIN';
  }
  get isTeacher(): boolean { return this.currentUser?.role === 'TEACHER'; }

  private patchForm(n: NoticeDto): void {
    this.formTitle = n.title;
    this.formDescription = n.description;
    this.formPublishDate = n.publishDate;
    this.formExpiryDate = n.expiryDate;
    this.cdr.markForCheck();
  }

  loadTeacherClass(): void {
    this.isLoadingTeacherClass = true;
    this.http.get<any>('/teacher/myClass')
      .pipe(catchError(err => { console.error('myClass load failed:', err); return of(null); }))
      .subscribe(res => {
        this.isLoadingTeacherClass = false;
        if (res?.success && res.data) {
          this.teacherClassId = res.data.classId;
          this.teacherSectionId = res.data.sectionId;
          this.teacherClassName = `${res.data.className} - ${res.data.sectionName}`;
        }
        this.cdr.markForCheck();
      });
  }

  loadAcademicSession(): void {
    this.http.post<any>('/param/list', {
      page: 0, size: 100, sortBy: 'sessionName', sortDirection: 'ASC', type: 'academic_sessions'
    })
      .pipe(catchError(err => { console.error('Academic session load failed:', err); return of(null); }))
      .subscribe(res => {
        this.academicSessionId = res?.data?.[0]?.id ?? null;
        this.cdr.markForCheck();
      });
  }

  get isFormValid(): boolean {
    if (!this.formTitle.trim() || !this.formDescription.trim()) return false;
    if (!this.formPublishDate || !this.formExpiryDate) return false;
    if (this.isTeacher && !this.teacherClassId) return false;
    return true;
  }

  submitNotice(): void {
    if (!this.isFormValid || !this.academicSessionId) {
      this.showToast('error', 'Please fill all required fields.');
      return;
    }

    // Admin payload: title, description, publishDate, expiryDate, academicSessionId, createdBy
    // Teacher payload: same + classId, sectionId (apni class se auto)
    const payload: NoticeUpsertRequest = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      publishDate: this.formPublishDate,
      expiryDate: this.formExpiryDate,
      academicSessionId: this.academicSessionId,
      createdBy: this.currentUser?.id ?? '' // logged-in user id
    };

    if (this.isTeacher) {
      payload.classId = this.teacherClassId!;
      payload.sectionId = this.teacherSectionId!;
    }

    if (this.isEditMode && this.formId) {
      payload.id = this.formId;
    }

    this.isSaving = true;
    this.noticeService.addOrUpdateNotice(payload)
      .pipe(catchError(err => {
        console.error('Notice save failed:', err);
        this.showToast('error', 'Failed to save notice.');
        return of(null);
      }))
      .subscribe(res => {
        this.isSaving = false;
        if (res && res.success !== false) {
          this.showToast('success', this.isEditMode ? 'Notice updated!' : 'Notice published!');
          this.goBack();
        }
        this.cdr.markForCheck();
      });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toast = { type, message };
    this.cdr.markForCheck();
    clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => { this.toast = null; this.cdr.markForCheck(); }, 2500);
  }
}
