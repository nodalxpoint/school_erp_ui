import { StudentUdiseResponseDto } from '../../udise/models/udise.model';

// ─── Full student response (backend se aata hai) ──────────────────
export interface StudentResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: string;
  admissionDate?: string;
  classId?: string;
  className?: string;      // ← backend se directly aata hai
  sectionId?: string;
  sectionName?: string;    // ← backend se directly aata hai
  academicSessionId?: string;
  academicSessionName?: string;
  guardianName?: string;   
  guardianEmail?: string;       
  attendance?: unknown; 
  rollNo?: string;
  fatherName?: string;
  motherName?: string;
  emergencyContact?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
  udise?: StudentUdiseResponseDto;
  passKey?: string;
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
  id?: string; 
  firstName?: string;
  lastName?: string;
  admissionNo?: string;
  classId?: string;
  sectionId?: string;
  academicSessionId?: string;
}

// ─── Backend PagedResponse (exact structure) ──────────────────────
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
  data: T | null;
  timestamp?: string;
}

// ─── Params API ───────────────────────────────────────────────────
export interface ParamListRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  type: 'classes' | 'sections' | 'teachers' | 'subjects' | 'students' | 'academic_sessions' | 'fee_structures' | string;
  classId?: string;
  search?: string;
}

export interface DropdownOption {
  id: string;
  label: string;
  amount?: number;
}
// Isko student.model.ts file ke end me append kar lijiye

// ─── Existing Parent Search Models ────────────────────────────────
export interface ParentSearchRequest {
  name: string;
}

export interface ParentSearchResultDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  emergencyContact: string;
  createdAt: string | null;
}

export interface ParentSearchApiResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    timestamp: string;
    data: ParentSearchResultDto[];
  };
  timestamp: string;
}