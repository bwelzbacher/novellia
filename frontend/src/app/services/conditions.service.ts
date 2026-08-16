import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Condition,
  ConditionDetail,
  ConditionStatus,
  CreateConditionPayload,
  UpdateConditionPayload,
} from '../models/condition.model';
import { API_BASE_URL } from './pets.service';

export interface ConditionFilter {
  petId?: string;
  status?: ConditionStatus;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConditionsService {
  private readonly http = inject(HttpClient);

  getConditions(filter: ConditionFilter = {}): Observable<Condition[]> {
    let params = new HttpParams();
    if (filter.petId) {
      params = params.set('petId', filter.petId);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    return this.http.get<Condition[]>(`${API_BASE_URL}/conditions`, { params });
  }

  getCondition(id: string): Observable<ConditionDetail> {
    return this.http.get<ConditionDetail>(`${API_BASE_URL}/conditions/${id}`);
  }

  createCondition(payload: CreateConditionPayload): Observable<Condition> {
    return this.http.post<Condition>(`${API_BASE_URL}/conditions`, payload);
  }

  updateCondition(id: string, payload: UpdateConditionPayload): Observable<Condition> {
    return this.http.patch<Condition>(`${API_BASE_URL}/conditions/${id}`, payload);
  }

  // Soft-deletes the condition — the backend also unlinks it from any
  // appointment/medication that referenced it.
  deleteCondition(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/conditions/${id}`);
  }
}
