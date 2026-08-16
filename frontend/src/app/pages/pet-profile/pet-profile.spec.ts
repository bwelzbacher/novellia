import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PetProfile } from './pet-profile';
import { Pet } from '../../models/pet.model';
import { MedicalRecordsService } from '../../services/medical-records.service';
import { PetsService } from '../../services/pets.service';

const MOCK_PET: Pet = {
  id: '1',
  name: 'Rex',
  species: 'DOG',
  breed: 'Labrador',
  dateOfBirth: '2020-01-01T00:00:00.000Z',
  sex: 'MALE',
  weightLbs: 12.5,
  microchipId: 'CHIP1',
  ownerName: 'Alex',
  ownerEmail: 'alex@example.com',
  ownerPhone: '555-1234',
  isActive: true,
  inactiveReason: null,
  photoUrl: null,
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('PetProfile', () => {
  let component: PetProfile;
  let fixture: ComponentFixture<PetProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetProfile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
        { provide: PetsService, useValue: { getPet: () => of(MOCK_PET) } },
        { provide: MedicalRecordsService, useValue: { getMedicalRecords: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PetProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
