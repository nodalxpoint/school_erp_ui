export interface Class {
  id: string;
  schoolId: string;
  className: string;
  createdAt: string;
}

export interface ClassesDto {
  id: string;
  className: string;
}

export interface CreateClassDto {
  className: string;
  classId?: string;
  sections: string[];
}

export interface BulkCreateClassDto {
  classes: CreateClassDto[];
}

export interface ClassFormState {
  className: string;
  classId: string;
  sections: string[];
}