// Matches AcademicSessionResponseDto.java exactly
export interface AcademicSessionResponseDto {
  id: string;           // UUID as string
  sessionName: string;
  startDate: string;    // LocalDate → "YYYY-MM-DD"
  endDate: string;
  isActive: boolean;
}

// Matches AcademicSessionFilterRequest.java + BaseFilterRequest
export interface AcademicSessionFilterRequest {
  sessionName?: string;
  isActive?: boolean;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}