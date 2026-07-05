import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserResponseDto } from '../../models/user.model';

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
    this.router.navigate(['/users/edit'], { state: { user } });
  }
}