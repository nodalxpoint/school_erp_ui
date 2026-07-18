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

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

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
}
