// ─── Matches StudentResponseDto.java exactly ─────────────────────
export interface StudentResponseDto {
  id: string;          // UUID as string
  firstName: string;
  lastName: string;
  admissionNo: string;
}

// ─── Matches addOrUpdate payload exactly ─────────────────────────
export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  admissionDate: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
  rollNo: string;
  fatherName: string;
  motherName: string;
  emergencyContact: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  parentPassword: string;
  studentId?: string;
}

// ─── Matches /api/students/list payload ──────────────────────────
export interface StudentFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  firstName?: string;
  lastName?: string;
  admissionNo?: string;
  classId?: string;
  sectionId?: string;
}

// ─── Matches PagedResponse<T> from backend ────────────────────────
export interface PagedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  message?: string;
  success?: boolean;
  timestamp?: string;
}

// ─── Generic API response ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp?: string;
}