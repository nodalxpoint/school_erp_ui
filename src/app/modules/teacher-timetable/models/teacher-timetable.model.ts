export interface TeacherTimetableFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  teacherId?: string;
  academicSessionId?: string;
  dayOfWeek?: string;
}