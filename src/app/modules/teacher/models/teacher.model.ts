// ─── Teacher ──────────────────────────────────────────────────────

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  employeeCode: string;
  qualification: string;
  joiningDate: string; // "YYYY-MM-DD"
  userId?: string;     // present = update
}

export interface TeacherFilterRequest {
  employeeCode?: string;
  qualification?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

// Matches TeacherResponseDto.java exactly
export interface TeacherResponseDto {
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  qualification: string;
  joiningDate: string;
}

// Extended for dropdown use — id comes from the entity
// TeacherResponseDto doesn't have id, so we use a union when needed
export interface TeacherDropdownItem extends TeacherResponseDto {
  id: string;
}

// ─── Assignment ───────────────────────────────────────────────────

// Matches AssignClassTeacherDto.java exactly
export interface AssignClassTeacherRequest {
  classId: string;
  sectionId: string;
  teacherId: string;
  academicSessionId: string;
}

// ─── Class & Section ──────────────────────────────────────────────
// TODO: update field names once GET API is built
// Backend entity fields: id (UUID), className, schoolId

export interface ClassItem {
  id: string;
  className: string; // matches Classes.java → getClassName()
}

// Backend entity fields: id (UUID), classId, sectionName
export interface SectionItem {
  id: string;
  sectionName: string; // matches SectionEntity.java → getSectionName()
  classId: string;
}

// ─── Shared API wrappers ──────────────────────────────────────────

// Matches PagedResponse<T> from backend
export interface PagedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  message: string;
}

// Matches ApiResponse<T> from backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}