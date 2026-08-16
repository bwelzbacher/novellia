import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AppointmentRecord,
  CreateMedicalRecordPayload,
  MedicalRecord,
  MedicationRecord,
  UpdateMedicalRecordPayload,
} from '../models/medical-record.model';
import { API_BASE_URL } from './pets.service';

export interface MedicalRecordFilter {
  petId?: string;
  vetRecordId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordsService {
  private readonly http = inject(HttpClient);

  getMedicalRecords(filter: MedicalRecordFilter = {}): Observable<MedicalRecord[]> {
    let params = new HttpParams();
    if (filter.petId) {
      params = params.set('petId', filter.petId);
    }
    if (filter.vetRecordId) {
      params = params.set('vetRecordId', filter.vetRecordId);
    }
    if (filter.dateFrom) {
      params = params.set('dateFrom', filter.dateFrom);
    }
    if (filter.dateTo) {
      params = params.set('dateTo', filter.dateTo);
    }
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    return this.http.get<MedicalRecord[]>(`${API_BASE_URL}/medical-records`, { params });
  }

  getMedicalRecord(id: string): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${API_BASE_URL}/medical-records/${id}`);
  }

  createMedicalRecord(payload: CreateMedicalRecordPayload): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${API_BASE_URL}/medical-records`, payload);
  }

  updateMedicalRecord(id: string, payload: UpdateMedicalRecordPayload): Observable<MedicalRecord> {
    return this.http.patch<MedicalRecord>(`${API_BASE_URL}/medical-records/${id}`, payload);
  }

  // Soft-deletes the whole visit — cascades on the backend to its own
  // vaccines/medications/appointment notes.
  deleteMedicalRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/medical-records/${id}`);
  }

  deleteVaccine(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/medical-records/vaccines/${id}`);
  }

  deleteMedication(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/medical-records/medications/${id}`);
  }

  deleteAppointmentNote(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/medical-records/notes/${id}`);
  }

  // Unlinks an appointment/medication from its condition without deleting
  // it — used by the condition-detail page's "Remove" actions.
  removeAppointmentCondition(appointmentId: string): Observable<AppointmentRecord> {
    return this.http.patch<AppointmentRecord>(
      `${API_BASE_URL}/medical-records/appointments/${appointmentId}/remove-condition`,
      {},
    );
  }

  removeMedicationCondition(medicationId: string): Observable<MedicationRecord> {
    return this.http.patch<MedicationRecord>(
      `${API_BASE_URL}/medical-records/medications/${medicationId}/remove-condition`,
      {},
    );
  }

  // Links a medication to a condition — used by the condition-detail page's
  // "Add" action to associate an existing medication with this condition.
  setMedicationCondition(medicationId: string, conditionId: string): Observable<MedicationRecord> {
    return this.http.patch<MedicationRecord>(
      `${API_BASE_URL}/medical-records/medications/${medicationId}/set-condition`,
      { conditionId },
    );
  }

  // Links an appointment to a condition — used by the condition-detail
  // page's "Add" action to associate an existing appointment with this
  // condition.
  setAppointmentCondition(appointmentId: string, conditionId: string): Observable<AppointmentRecord> {
    return this.http.patch<AppointmentRecord>(
      `${API_BASE_URL}/medical-records/appointments/${appointmentId}/set-condition`,
      { conditionId },
    );
  }
}
