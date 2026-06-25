import { ExamSubjectDto } from '../../exam-schedule/models/exam-schedule.model';

export interface StudentMarksRecordDto {
  studentId: string;
  studentName?: string;  // UI par dikhane ke liye
  rollNo?: string;       // UI standard ke liye
  className?: string;    // ✅ NEW: UI par class dikhane ke liye
  sectionName?: string;  // ✅ NEW: UI par section dikhane ke liye
  marksObtained: number;
  remarks: string;
}

export interface ExamMarksSavePayload {
  examSubjectId: string;
  examId: string;
  academicSessionId: string;
  records: StudentMarksRecordDto[];
}

// Student lookup payload scheme
export interface StudentClassFilterRequest {
  classId: string;
  sectionId: string;
  page: number;
  size: number;
}