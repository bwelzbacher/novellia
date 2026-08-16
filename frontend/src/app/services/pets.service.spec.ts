import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PetsService } from '../services/pets.service';
import { PaginatedPets } from '../models/pet.model';

describe('PetsService', () => {
  let service: PetsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PetsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests pets with no query params by default', () => {
    const response: PaginatedPets = {
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    };

    service.getPets().subscribe((result: PaginatedPets) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:3000/pets',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(response);
  });

  it('forwards species, name, and page as query params', () => {
    service
      .getPets({ species: 'DOG', name: 'rex', page: 2 })
      .subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:3000/pets',
    );
    expect(req.request.params.get('species')).toBe('DOG');
    expect(req.request.params.get('name')).toBe('rex');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ data: [], page: 2, pageSize: 20, total: 0, totalPages: 0 });
  });
});
