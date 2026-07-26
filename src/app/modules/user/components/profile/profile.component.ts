import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { getInitials } from '../../../../shared/utils/format.utils';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  loading = true;
  error: string | null = null;

  showPassKey = false;
  showTeacherPassKey = false;
  showParentPassKey = false;
  copiedKey: string | null = null;

  toast: { type: 'success' | 'error'; message: string } | null = null; // NEW
  private toastTimeoutId: any = null; // NEW

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.loading = true;
    this.error = null;
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.profile = res.data;
        } else {
          this.error = res?.message || 'Failed to fetch profile details';
        }
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.error = 'Unable to connect to the server. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  getFormatRole(role: string): string {
    if (!role) return '';
    return role.replace('_', ' ');
  }

  togglePassKey(): void {
    this.showPassKey = !this.showPassKey;
  }

  toggleTeacherPassKey(): void {
    this.showTeacherPassKey = !this.showTeacherPassKey;
  }

  toggleParentPassKey(): void {
    this.showParentPassKey = !this.showParentPassKey;
  }

  copyToClipboard(value: string, key: string): void {
  if (!value) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value).then(() => {
      this.onCopySuccess(key);
    }).catch(() => {
      this.fallbackCopy(value, key);
    });
  } else {
    // HTTP / non-secure context — navigator.clipboard undefined hota hai
    this.fallbackCopy(value, key);
  }
}

private fallbackCopy(value: string, key: string): void {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      this.onCopySuccess(key);
    } else {
      this.showToast('error', 'Failed to copy. Please try again.');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    this.showToast('error', 'Failed to copy. Please try again.');
  }
}

private onCopySuccess(key: string): void {
  this.copiedKey = key;
  this.showToast('success', 'Copied to clipboard!');
  setTimeout(() => {
    this.copiedKey = null;
    this.cdr.markForCheck();
  }, 2000);
  this.cdr.markForCheck();
}

   private showToast(type: 'success' | 'error', message: string): void {
    this.toast = { type, message };
    this.cdr.markForCheck();
    clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => {
      this.toast = null;
      this.cdr.markForCheck();
    }, 2500);
  }
}
