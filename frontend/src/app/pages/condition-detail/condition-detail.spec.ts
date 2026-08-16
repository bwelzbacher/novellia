import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ConditionDetail } from './condition-detail';
import { ConditionsService } from '../../services/conditions.service';
import { PetsService } from '../../services/pets.service';

describe('ConditionDetail', () => {
  let component: ConditionDetail;
  let fixture: ComponentFixture<ConditionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionDetail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ petId: '1', conditionId: 'c1' }) },
          },
        },
        { provide: PetsService, useValue: { getPet: () => of(null) } },
        { provide: ConditionsService, useValue: { getCondition: () => of(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
