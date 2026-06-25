export interface ChildStudentDto {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  admissionDate: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  academicSessionId: string;
  rollNo: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  emergencyContact: string;
  attendance: any;
}

export interface ParentChildrenApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    success: boolean;
    message: string;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    timestamp: string;
    data: ChildStudentDto[]; // Core dynamic records array
  };
}