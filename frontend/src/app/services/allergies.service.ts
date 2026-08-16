import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Allergy,
  AllergySeverity,
  CreateAllergyPayload,
  UpdateAllergyPayload,
} from '../models/allergy.model';
import { API_BASE_URL } from './pets.service';

export interface AllergyFilter {
  petId?: string;
  severity?: AllergySeverity;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AllergiesService {
  private readonly http = inject(HttpClient);

  getAllergies(filter: AllergyFilter = {}): Observable<Allergy[]> {
    let params = new HttpParams();
    if (filter.petId) {
      params = params.set('petId', filter.petId);
    }
    if (filter.severity) {
      params = params.set('severity', filter.severity);
    }
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    return this.http.get<Allergy[]>(`${API_BASE_URL}/allergies`, { params });
  }

  createAllergy(payload: CreateAllergyPayload): Observable<Allergy> {
    return this.http.post<Allergy>(`${API_BASE_URL}/allergies`, payload);
  }

  updateAllergy(id: string, payload: UpdateAllergyPayload): Observable<Allergy> {
    return this.http.patch<Allergy>(`${API_BASE_URL}/allergies/${id}`, payload);
  }

  deleteAllergy(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/allergies/${id}`);
  }
}
