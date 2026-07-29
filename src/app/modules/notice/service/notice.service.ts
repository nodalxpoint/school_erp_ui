import { Injectable } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';
import { Observable } from 'rxjs';
import { NoticeDto, NoticeListRequest, NoticeUpsertRequest, PagedResult } from '../models/notice.model';

@Injectable({ providedIn: 'root' })
export class NoticeService {
  constructor(private http: HttpService) {}

  filterNotices(request: NoticeListRequest): Observable<PagedResult<NoticeDto>> {
    return this.http.post<PagedResult<NoticeDto>>('/notice/list', request);
    // NOTE: agar Files module jaisa double-wrap issue yahan bhi mile
    // (res.data.data), to yahan .pipe(map(res => (res as any).data)) laga dena.
  }

  addOrUpdateNotice(payload: NoticeUpsertRequest): Observable<any> {
    return this.http.post<any>('/notice/addOrUpdate', payload);
  }
}
