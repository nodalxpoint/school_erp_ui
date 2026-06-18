export interface ExamSubjectDto {
  id?: string;
  examId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string; // YYYY-MM-DD
  examDay?: string;
  classId: string;
  className?: string;
}

export interface BackendExamDto {
  examId: string;
  academicSessionId: string;
  examName: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  subjects?: ExamSubjectDto[]; // ✅ FIXED: Changed from examSubjects to subjects to perfectly match your response JSON
}