export interface StudentFeeResponseDto {
  id: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  academicSessionId: string;
  feeMonth: number;
  feeYear: number;
  amount: number;
  dueDate: string;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  paidAt: string | null;
  remarks: string;
  createdAt: string;
  classId: string;
  sectionId: string;
}

export interface FeeFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  paymentStatus?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  feeMonth?: number;
  feeYear?: number;
}

export interface SaveFeeRequest {
  feeId?: string;
  studentId: string;
  academicSessionId: string;
  feeMonth: number;
  feeYear: number;
  amount: number;
  dueDate: string;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  remarks: string;
}