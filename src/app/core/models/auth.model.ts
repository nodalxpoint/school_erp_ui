// core/models/auth.model.ts

export type UserRole = 'PLATFORM_ADMIN' | 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'SCHOOL_ADMIN';

// Only meaningful when role === 'PLATFORM_ADMIN'. Absent/null means EDIT (backend
// grandfathers platform admins created before this field existed as full-rights).
export type PlatformAdminAccessLevel = 'EDIT' | 'VIEW_ONLY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId: string;
  platformAdminAccessLevel?: PlatformAdminAccessLevel | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: UserRole;
}

// ✅ Backend actual response structure
export interface LoginApiResponse {
  success: boolean;
  message: string;
  data: {
    role: UserRole;
    token: string;
  };
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}