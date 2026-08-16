import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { RecordDetail } from './record-detail';
import { MedicalRecordsService } from '../../services/medical-records.service';
import { PetsService } from '../../services/pets.service';

describe('RecordDetail', () => {
  let component: RecordDetail;
  let fixture: ComponentFixture<RecordDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordDetail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ petId: '1', recordId: 'r1' }) },
          },
        },
        { provide: PetsService, useValue: { getPet: () => of(null) } },
        { provide: MedicalRecordsService, useValue: { getMedicalRecord: () => of(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
