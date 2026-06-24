// src/app/modules/exams/models/exam.model.ts

export interface ExamDto {
  id?: string;
  examId?: string;
  academicSessionId: string;
  examName: string;
  startDate: string; // YYYY-MM-DD template standard
  endDate: string;   // YYYY-MM-DD template standard
  createdAt?: string;
  isActive?: 'Y' | 'N'; // <-- Added '?' to make it optional, fixing TS2741 Form Error!
  examSubjects?: any;
}

export interface ExamFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  academicSessionId?: string;
  examName?: string;
}