export interface NoticeDto {
  id: string;
  classId: string | null;
  className?: string;   // display ke liye, agar backend bhejta hai
  sectionId?: string | null;
  sectionName?: string; // display ke liye, agar backend bhejta hai
  title: string;
  description: string;
  publishDate: string; // yyyy-MM-dd
  expiryDate: string;
  academicSessionId?: string;
  createdBy: string;
  createdAt?: string;
}

export interface NoticeListRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: string;
  classId?: string;   // teacher/parent list ke liye — my class se aayega
  sectionId?: string; // teacher/parent list ke liye — my class se aayega
}

export interface NoticeUpsertRequest {
  id?: string;         // update ke waqt bhejna, create me omit
  title: string;
  description: string;
  publishDate: string;
  expiryDate: string;
  academicSessionId: string;
  createdBy: string;   // logged-in user ki id
  classId?: string;    // sirf teacher creating notice tab bhejna
  sectionId?: string;  // sirf teacher creating notice tab bhejna
  targetType?: string;   
}

export interface PagedResult<T> {
  success: boolean;
  message: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  data: T[];
}
