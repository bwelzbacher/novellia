import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PetCard } from './pet-card';
import { Pet } from '../../models/pet.model';

const MOCK_PET: Pet = {
  id: '1',
  name: 'Rex',
  species: 'DOG',
  breed: 'Labrador',
  dateOfBirth: null,
  sex: 'MALE',
  weightLbs: null,
  microchipId: null,
  ownerName: 'Alex',
  ownerEmail: null,
  ownerPhone: null,
  isActive: true,
  inactiveReason: null,
  photoUrl: null,
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('PetCard', () => {
  let component: PetCard;
  let fixture: ComponentFixture<PetCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetCard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PetCard);
    fixture.componentRef.setInput('pet', MOCK_PET);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
