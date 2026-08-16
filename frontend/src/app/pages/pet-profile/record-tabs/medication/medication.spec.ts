import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { MedicationComponent } from './medication';
import { AllergiesService } from '../../../../services/allergies.service';
import { ConditionsService } from '../../../../services/conditions.service';
import { MedicalRecordsService } from '../../../../services/medical-records.service';
import { PetsService } from '../../../../services/pets.service';
import { PetProfileStore } from '../../pet-profile.store';

describe('MedicationComponent', () => {
  let component: MedicationComponent;
  let fixture: ComponentFixture<MedicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationComponent],
      providers: [
        PetProfileStore,
        MatBottomSheet,
        { provide: PetsService, useValue: {} },
        { provide: MedicalRecordsService, useValue: {} },
        { provide: ConditionsService, useValue: {} },
        { provide: AllergiesService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationComponent);
    fixture.componentRef.setInput('petId', '1');
    fixture.componentRef.setInput('records', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
