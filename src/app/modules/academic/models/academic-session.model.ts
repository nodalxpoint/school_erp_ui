export interface AcademicSessionResponseDto {
  id: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AcademicSessionFilterRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  schoolId?: string;
}

export interface CreateAcademicSessionDto {
  sessionName: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  schoolId?: string;
}

export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  last?: boolean;
  timestamp?: string;
}