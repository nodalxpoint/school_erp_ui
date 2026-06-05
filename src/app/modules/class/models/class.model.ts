// Raw API response shapes
export interface SectionDto {
  sectionId: string;
  sectionName: string;
}

export interface ClassListApiResponse {
  success: boolean;
  message: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  timestamp: string;
  data: ClassListItem[];
}

export interface ClassListItem {
  classId: string;
  className: string;
  sections: SectionDto[];
}

// Used internally in frontend components
export interface Class {
  id: string;
  schoolId: string;
  className: string;
  sections: SectionDto[];
  createdAt: string;
}

export interface ClassesDto {
  id: string;
  className: string;
  sections: SectionDto[];
   createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassDto {
  className: string;
  sections: string[];
}

export interface BulkCreateClassDto {
  classes: CreateClassDto[];
}

export interface ClassFormState {
  className: string;
  sections: string[];
}