import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RecordExtractionDraft } from '../models/record-extraction.model';
import { API_BASE_URL } from './pets.service';

@Injectable({
  providedIn: 'root',
})
export class RecordExtractionService {
  private readonly http = inject(HttpClient);

  extract(petId: string, file: File): Observable<RecordExtractionDraft> {
    const formData = new FormData();
    formData.append('document', file);
    const params = new HttpParams().set('petId', petId);
    return this.http.post<RecordExtractionDraft>(`${API_BASE_URL}/record-extraction`, formData, {
      params,
    });
  }
}
