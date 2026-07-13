// src/app/modules/udise/models/udise.model.ts

export interface StudentUdiseResponseDto {
  id: string;
  schoolId: string;
  schoolName: string;
  academicSessionId: string;
  academicSessionName: string;
  studentId: string;
  studentName: string;
  pen?: string;
  apaarId?: string;
  aadhaarLastFour?: string;
  nameAsPerAadhaar?: string;
  pincode?: string;
  motherTongue?: string;
  socialCategory?: string;
  minorityGroup?: string;
  bplBeneficiary: boolean;
  ewsDisadvantaged: boolean;
  indianNational: boolean;
  cwsn: boolean;
  disabilityType?: string;
  outOfSchoolCurrentYear: boolean;
  outOfSchoolPreviousYear: boolean;
  udiseStatus?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveStudentUdiseDto {
  id?: string;
  studentId: string;
  academicSessionId: string;
  pen?: string;
  apaarId?: string;
  aadhaarLastFour?: string;
  nameAsPerAadhaar?: string;
  pincode?: string;
  udiseStatus?: string;
  motherTongue?: string;
  socialCategory?: string;
  minorityGroup?: string;
  bplBeneficiary?: boolean;
  ewsDisadvantaged?: boolean;
  indianNational?: boolean;
  cwsn?: boolean;
  disabilityType?: string;
  outOfSchoolCurrentYear?: boolean;
  outOfSchoolPreviousYear?: boolean;
}

export interface StudentUdiseFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  studentId?: string;
  academicSessionId?: string;
  schoolId?: string;
  udiseStatus?: string;
  pen?: string;
}
