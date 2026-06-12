// src/app/modules/attendance/models/attendance.model.ts

export interface AttendanceRecordDto {
  studentId: string;
  status: 'PRESENT' | 'ABSENT';
  remarks: string;
}

export interface BulkAttendanceRequestDto {
  classId: string;
  sectionId: string;
  academicSessionId: string;
  attendanceDate: string;
  records: AttendanceRecordDto[];
}

export interface TeacherClassResponseDto {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  attendanceCheck: string | null; // Mapped dynamically according to backend response JSON payload
}



export interface AttendanceResponseDto {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  remarks?: string;
  attendanceDate: string;
}

export interface AttendanceFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  classId?: string;
  sectionId?: string;
  academicSessionId?: string;
  attendanceDate?: string;
}

export interface StudentAttendanceRow {
  studentId: string;
  rollNumber?: string;
  firstName: string;
  lastName?: string;
  status: 'PRESENT' | 'ABSENT';
  remarks: string;
}