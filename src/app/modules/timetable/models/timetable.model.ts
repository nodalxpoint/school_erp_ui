export interface TimetableDto {
  id?: string; // Present on update, absent on create
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  period: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // "HH:mm:ss" or "HH:mm"
  endTime: string;   // "HH:mm:ss" or "HH:mm"
  roomNo?: string;

  // Response Extra Fields
  className?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
  academicSessionName?: string;
}

export interface TimetableFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  classId?: string;
  sectionId?: string;
  teacherId?: string;
  dayOfWeek?: string;
  academicSessionId?: string;
}