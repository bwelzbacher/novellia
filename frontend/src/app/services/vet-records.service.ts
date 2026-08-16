import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateVetRecordPayload, VetRecord } from '../models/vet-record.model';
import { API_BASE_URL } from './pets.service';

export interface VetRecordFilter {
  officeName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VetRecordsService {
  private readonly http = inject(HttpClient);

  getVetRecords(filter: VetRecordFilter = {}): Observable<VetRecord[]> {
    let params = new HttpParams();
    if (filter.officeName) {
      params = params.set('officeName', filter.officeName);
    }
    return this.http.get<VetRecord[]>(`${API_BASE_URL}/vet-records`, { params });
  }

  createVetRecord(payload: CreateVetRecordPayload): Observable<VetRecord> {
    return this.http.post<VetRecord>(`${API_BASE_URL}/vet-records`, payload);
  }
}
