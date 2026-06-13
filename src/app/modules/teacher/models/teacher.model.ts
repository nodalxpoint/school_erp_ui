// ─── Entities / Response DTOs ───────────────────────────────────────────────

export interface TeacherResponseDto {
  id?: string;
  teacherId?: string;
  userId?: string;
  firstName: string;
  lastName?: string;
  email: string;
  employeeCode?: string;
  qualification?: string;
  joiningDate?: string;
}
export interface ClassTeacherAssignmentResponseDto {
  id: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  teacherId: string;
  teacherName?: string;
  academicSessionId: string;
  academicSessionName?: string;
  createdAt?: string;
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface CreateTeacherDto {
  userId?: string;          // present = update, absent = create
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;        // only for create
  employeeCode?: string;
  qualification?: string;
  joiningDate?: string;
}

export interface AssignClassTeacherDto {
  classId: string;
  sectionId: string;
  teacherId: string;
  academicSessionId: string;
}

// ─── Filter requests (mirrors BaseFilterRequest + extra fields) ───────────────

export interface TeacherFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  firstName?: string;
  schoolId?: string;
}

export interface ClassTeacherAssignmentFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  classId?: string;
  sectionId?: string;
  teacherId?: string;
  teacherName?: string;
  academicSessionId?: string;
}


export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  last?: boolean;
  timestamp?: string;
}

// ─── Form state helpers ───────────────────────────────────────────────────────

export interface TeacherFormState {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  employeeCode: string;
  qualification: string;
  joiningDate: string;
}

export interface AssignTeacherFormState {
  classId: string;
  sectionId: string;
  teacherId: string;
  academicSessionId: string;
}