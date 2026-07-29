import { Injectable } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileFilterRequest, OuterApiResponse, PagedResult, UploadedFileDto } from '../models/file.model';

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private http: HttpService) {}

  filterFiles(request: FileFilterRequest): Observable<PagedResult<UploadedFileDto>> {
    return this.http
      .post<OuterApiResponse<PagedResult<UploadedFileDto>>>('/files/list', request)
      .pipe(
        map(res => res.data) // outer wrapper hata ke asli PagedResult return karo
      );
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>('/files/upload', formData);
  }

  getFileMetadata(id: string): Observable<any> {
    return this.http.get<any>(`/files/${id}`);
  }

  deleteFile(id: string): Observable<any> {
    return this.http.delete<any>(`/files/${id}`);
  }
}