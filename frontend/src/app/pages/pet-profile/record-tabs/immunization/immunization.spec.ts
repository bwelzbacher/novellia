import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImmunizationComponent } from './immunization';

describe('ImmunizationComponent', () => {
  let component: ImmunizationComponent;
  let fixture: ComponentFixture<ImmunizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmunizationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImmunizationComponent);
    fixture.componentRef.setInput('records', []);
    fixture.componentRef.setInput('petId', '1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
