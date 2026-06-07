// ─── Matches TeacherResponseDto.java exactly ──────────────────────
export interface TeacherResponseDto {
  teacherId?: string;      // may come as id depending on mapping
  id?: string;
  userId?: string;         // needed for update
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  qualification?: string;
  joiningDate?: string;    // LocalDate → "YYYY-MM-DD" string in JSON
}

// ─── Add / Update payload ─────────────────────────────────────────
export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;       // required on add, optional on edit
  employeeCode: string;
  qualification: string;
  joiningDate: string;
  userId?: string;         // present only on update
}

// ─── Assign class teacher — matches AssignClassTeacherDto.java ────
export interface AssignClassTeacherRequest {
  classId: string;
  sectionId: string;
  teacherId: string;
  academicSessionId: string;
}

export interface AssignClassTeacherResponse {
  success: boolean;
  message: string;
  data?: unknown;
  timestamp?: string;
}

// ─── Filter request — matches TeacherFilterRequest.java ──────────
export interface TeacherFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeCode?: string;
  qualification?: string;
}

// ─── PagedResponse (exact backend structure) ──────────────────────
export interface PagedResponse<T> {
  success: boolean;
  message: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  timestamp: string;
  data: T[];
}

// ─── Generic API response ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T | null;
  timestamp?: string;
}