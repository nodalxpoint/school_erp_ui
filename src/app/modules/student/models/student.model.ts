// ─── Full student response (list me aata hai) ────────────────────
export interface StudentResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: string;
  admissionDate?: string;
  classId?: string;
  sectionId?: string;
  academicSessionId?: string;
  rollNo?: string;
  fatherName?: string;
  motherName?: string;
  emergencyContact?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

// ─── addOrUpdate payload ──────────────────────────────────────────
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
  parentPassword?: string;
  studentId?: string;
}

// ─── /api/students/list payload ──────────────────────────────────
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

// ─── PagedResponse<T> ─────────────────────────────────────────────
export interface PagedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  message?: string;
  success?: boolean;
}

// ─── Generic API response ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// ─── Params API (/api/params/list) ───────────────────────────────
export interface ParamListRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  type: 'classes' | 'sections' | 'teachers' | 'subjects' | 'students';
  classId?: string;   // required when type = 'sections'
  search?: string;
}

export interface DropdownOption {
  id: string;
  label: string;
}
