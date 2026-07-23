import { DropdownOption } from '../../student/models/student.model';

// Backend ka raw response shape — har entry ek examSubject hai jiske
// andar records[] hota hai (abhi 1 record per entry, future me multiple ho sakte hain)
export interface ExamMarksRecord {
  studentId: string;
  studentName?: string;
  className?: string;
  sectionName?: string;
  marksObtained: number;
  remarks?: string;
  admissionNo?: string;
  rollNo?: string;
  maxMarks?: number;
}

export interface ExamMarksApiDto {
  id: string;
  examSubjectId: string;
  examId: string;
  examName?: string;
  subjectName?: string;
  academicSessionId: string | null;
  records: ExamMarksRecord[];
}

// UI ke liye flattened row — har record ka alag row.
// studentName, subjectName, className, sectionName, admissionNo, rollNo,
// maxMarks — abhi backend response me nahi hain, jab backend add karega
// to ye automatically table me show hone lagenge (HTML already inhe use karta hai).
export interface ExamMarksResponseDto {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  rollNo?: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
  examName?: string;
  examId: string;
  examSubjectId: string;
  marksObtained: number;
  maxMarks?: number;
  remarks?: string;
  academicSessionId?: string;
}

export interface ExamMarksFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  firstName?: string;   // free text search
  studentId?: string;   // suggestion se select hua student
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  examId?: string;
  academicSessionId?: string;
}

// /students/list response ka ek student object
export interface StudentSuggestion {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  rollNo: string;
  className: string;
  sectionName: string;
}

// /students/list POST body — sirf firstName jaata hai
export interface StudentSearchRequest {
  firstName: string;
}