import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserResponseDto } from '../../models/user.model';
import { UserListRequest } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users = signal<UserResponseDto[]>([]);
  loading = signal(false);

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService
      .listUsers({ page: 0, size: 100 })
      .subscribe({
        next: (res) => {
          this.users.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  openForm(): void {
    this.router.navigate(['/users/create']);
  }

  edit(user: UserResponseDto): void {
    if (!user.id) return;
    // 🔥 Fetch fresh data from API using userId before navigating to edit
    this.loading.set(true);
    this.userService.listUsers({ page: 0, size: 10, userId: user.id }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const freshUser = res.data?.[0] ?? user;
        this.router.navigate(['/users/edit'], { state: { user: freshUser } });
      },
      error: () => {
        this.loading.set(false);
        // Fallback: navigate with existing data if API fails
        this.router.navigate(['/users/edit'], { state: { user } });
      }
    });
  }

  deleteUser(user: UserResponseDto): void {
    if (!user.id) return;
    if (confirm(`Are you sure you want to delete the user "${user.firstName} ${user.lastName || ''}"?`)) {
      this.loading.set(true);
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          this.loading.set(false);
          alert(err?.error?.message || 'Failed to delete user.');
        }
      });
    }
  }
}