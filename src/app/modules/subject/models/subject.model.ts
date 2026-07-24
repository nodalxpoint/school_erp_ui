// ─── Entities / Response DTOs ───────────────────────────────────────────────

export interface SubjectResponseDto {
  id: string; // UUID mapped from backend
  name: string;
  code: string;
  createdAt?: string;
  isDeleted?: boolean;
}

export interface SubjectTeacherAssignmentResponseDto {
  id: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  academicSessionId: string;
  academicSessionName?: string;
  createdAt?: string;
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface CreateSubjectDto {
  id?: string;
  subjectName: string;
  subjectCode: string;
}

export interface AssignSubjectTeacherDto {
  assignmentId?: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
}

// ─── Filter Requests ─────────────────────────────────────────────────────────

export interface SubjectFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  name?: string;
  includeDeleted?: boolean;
}

export interface SubjectTeacherAssignmentFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  subjectId?: string;
  teacherId?: string;
  classId?: string;
  sectionId?: string;
  academicSessionId?: string;
  search?: string; // Add if backend supports global search on assignments
}