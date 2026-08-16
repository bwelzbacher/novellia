import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { AllergyComponent } from './allergy';
import { AllergiesService } from '../../../../services/allergies.service';
import { ConditionsService } from '../../../../services/conditions.service';
import { MedicalRecordsService } from '../../../../services/medical-records.service';
import { PetsService } from '../../../../services/pets.service';
import { PetProfileStore } from '../../pet-profile.store';

describe('AllergyComponent', () => {
  let component: AllergyComponent;
  let fixture: ComponentFixture<AllergyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllergyComponent],
      providers: [
        PetProfileStore,
        MatBottomSheet,
        { provide: PetsService, useValue: {} },
        { provide: MedicalRecordsService, useValue: {} },
        { provide: ConditionsService, useValue: {} },
        { provide: AllergiesService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllergyComponent);
    fixture.componentRef.setInput('allergies', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
