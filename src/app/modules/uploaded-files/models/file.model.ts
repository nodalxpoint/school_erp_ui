export interface UploadedFileDto {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

export interface FileFilterRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDirection: string;
  search?: string;
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

// NEW — backend ka outer wrapper (double-nested response ke liye)
export interface OuterApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}