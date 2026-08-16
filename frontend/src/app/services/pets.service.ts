import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePetPayload,
  PaginatedPets,
  Pet,
  PetFilter,
  PetInactiveReason,
  UpdatePetPayload,
} from '../models/pet.model';

export const API_BASE_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class PetsService {
  private readonly http = inject(HttpClient);

  // Paginated to 20 pets per page (server-enforced); pass `page` to page through results.
  getPets(filter: PetFilter = {}): Observable<PaginatedPets> {
    let params = new HttpParams();
    if (filter.species) {
      params = params.set('species', filter.species);
    }
    if (filter.name) {
      params = params.set('name', filter.name);
    }
    if (filter.page) {
      params = params.set('page', filter.page);
    }

    return this.http.get<PaginatedPets>(`${API_BASE_URL}/pets`, { params });
  }

  getPet(id: string): Observable<Pet> {
    return this.http.get<Pet>(`${API_BASE_URL}/pets/${id}`);
  }

  createPet(payload: CreatePetPayload): Observable<Pet> {
    return this.http.post<Pet>(`${API_BASE_URL}/pets`, payload);
  }

  updatePet(id: string, payload: UpdatePetPayload): Observable<Pet> {
    return this.http.patch<Pet>(`${API_BASE_URL}/pets/${id}`, payload);
  }

  uploadPetPhoto(id: string, photo: File): Observable<Pet> {
    const formData = new FormData();
    formData.append('photo', photo);
    return this.http.post<Pet>(`${API_BASE_URL}/pets/${id}/photo`, formData);
  }

  // Soft delete: the pet record is kept and marked inactive, optionally
  // with a reason, rather than removed from the database.
  deactivatePet(id: string, reason?: PetInactiveReason | null): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/pets/${id}`, {
      body: reason ? { reason } : {},
    });
  }
}
