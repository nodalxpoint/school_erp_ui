export interface ExamDto {
  id?: string;
  examId?: string;
  academicSessionId: string;
  examName: string;
  startDate: string; // YYYY-MM-DD template standard
  endDate: string;   // YYYY-MM-DD template standard
  createdAt?: string;
}

export interface ExamFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  academicSessionId?: string;
  examName?: string;
}