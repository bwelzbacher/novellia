import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { of } from 'rxjs';

import { MedicalRecordFormSheet } from './medical-record-form-sheet';
import { MedicalRecordsService } from '../../../services/medical-records.service';
import { VetRecordsService } from '../../../services/vet-records.service';
import { ConditionsService } from '../../../services/conditions.service';

describe('MedicalRecordFormSheet', () => {
  let component: MedicalRecordFormSheet;
  let fixture: ComponentFixture<MedicalRecordFormSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalRecordFormSheet],
      providers: [
        { provide: MatBottomSheetRef, useValue: { dismiss: () => { } } },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { petId: '1', kind: 'VACCINE' } },
        { provide: MedicalRecordsService, useValue: { createMedicalRecord: () => { } } },
        { provide: VetRecordsService, useValue: { getVetRecords: () => of([]) } },
        { provide: ConditionsService, useValue: { getConditions: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordFormSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
