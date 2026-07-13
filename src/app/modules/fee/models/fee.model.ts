export interface StudentFeeResponseDto {
  id: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  academicSessionId: string;
  feeStructureId: string;
  feeStructureName: string;
  feeMonth: number;
  feeYear: number;
  totalAmount: number;       // fee structure snapshot amount
  paidAmount: number;
  dueDate: string | null;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL' | 'WAIVED';
  paidAt: string | null;
  remarks: string | null;
  createdAt: string;
  classId: string;
  sectionId: string;
}


export interface FeeFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  paymentStatus?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  feeMonth?: number;
  feeYear?: number;
  studentId?: string;
}

export interface SaveFeeRequest {
  id?: string;             // present only in edit mode
  studentId: string;
  academicSessionId: string;
  feeMonth: number;
  feeYear: number;
}

// ── Fee Structure Models ──────────────────────────────────────
export interface FeeStructureDto {
  id?: string;
  schoolName?: string;
  classId?: string;
  className?: string;
  feeName: string;
  amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME';
  dueDate: string | null;
  createdAt?: string;
}

export interface FeeStructureFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  classId?: string;
  feeName?: string;
  frequency?: string;
  academicSessionId?: string;
}

export interface SaveFeeStructureRequest {
  id?: string;
  classId: string;
  feeName: string;
  amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME';
  dueDate?: string | null; 
}

// ── Monthly Fee Status Models ─────────────────────────────────
export interface MonthlyStatusRequest {
  studentId: string;
  academicSessionId: string;
}

export interface MonthFeeDetail {
  feeMonth: number;
  feeYear: number;
  monthName: string;
  status: 'PAID' | 'PENDING';
  totalAmount: number;
  paidAmount: number;
  paidAt: string | null;
  feeRecordId: string | null;
}

export interface MonthlyFeeStatusResponse {
  studentId: string;
  studentName: string;
  academicSessionId: string;
  sessionName: string;
  classId: string;
  className: string;
  monthlyFeeAmount: number;
  months: MonthFeeDetail[];
}