export interface UserResponseDto {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'ACCOUNTANT' | 'SCHOOL_ADMIN';
  isActive?: boolean;
  passKey?: string;
}

export interface SaveUserRequest {
  adminId?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword?: string;
  adminPhone: string;
  role: 'ACCOUNTANT' | 'SCHOOL_ADMIN';
}

export interface UserListRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
  userId?: string;
}