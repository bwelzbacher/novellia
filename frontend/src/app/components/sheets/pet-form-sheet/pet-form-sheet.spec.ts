import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { of } from 'rxjs';

import { PetFormSheet } from './pet-form-sheet';
import { Pet } from '../../../models/pet.model';
import { PetsService } from '../../../services/pets.service';

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

describe('PetFormSheet', () => {
  async function createFixture(data: { petId?: string }): Promise<ComponentFixture<PetFormSheet>> {
    await TestBed.configureTestingModule({
      imports: [PetFormSheet],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatBottomSheetRef, useValue: { dismiss: () => { } } },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: data },
        { provide: PetsService, useValue: { getPet: () => of(MOCK_PET) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PetFormSheet);
    await fixture.whenStable();
    return fixture;
  }

  it('should create in edit mode', async () => {
    const fixture = await createFixture({ petId: '1' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create in add-pet mode', async () => {
    const fixture = await createFixture({});
    expect(fixture.componentInstance).toBeTruthy();
  });
});
