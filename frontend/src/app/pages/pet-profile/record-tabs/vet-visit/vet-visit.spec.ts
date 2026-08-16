import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetVisit } from './vet-visit';

describe('VetVisit', () => {
  let component: VetVisit;
  let fixture: ComponentFixture<VetVisit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VetVisit],
    }).compileComponents();

    fixture = TestBed.createComponent(VetVisit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
