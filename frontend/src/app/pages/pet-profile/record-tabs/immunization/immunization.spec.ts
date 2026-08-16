import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Immunization } from './immunization';

describe('Immunization', () => {
  let component: Immunization;
  let fixture: ComponentFixture<Immunization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Immunization],
    }).compileComponents();

    fixture = TestBed.createComponent(Immunization);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
