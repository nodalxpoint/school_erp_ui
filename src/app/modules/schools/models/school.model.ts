// modules/schools/models/school.model.ts

export interface School {
  id: string;
  schoolName: string;
  schoolCode: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
}

export interface SchoolListApiResponse {
  success: boolean;
  message: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  timestamp: string;
  data: School[];
}

export interface SaveSchoolForm {
  schoolName: string;
  schoolCode: string;
  schoolEmail?: string;
  schoolPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logoUrl?: string;
}

export interface CreateSchoolForm extends SaveSchoolForm {
  adminFirstName: string;
  adminLastName?: string;
  adminEmail: string;
  adminPhone?: string;
}

export interface CreateSchoolResult {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  adminUserId: string;
  adminEmail: string;
  adminTemporaryPassword: string;
}

export interface PlatformStudentSummary {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName?: string | null;
  gender?: string | null;
  status?: string | null;
}

export interface PlatformTeacherSummary {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  employeeCode?: string | null;
  qualification?: string | null;
}

export interface PlatformPagedResponse<T> {
  success: boolean;
  message: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  data: T[];
}
