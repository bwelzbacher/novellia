import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionComponent } from './condition';

describe('ConditionComponent', () => {
  let component: ConditionComponent;
  let fixture: ComponentFixture<ConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionComponent);
    fixture.componentRef.setInput('conditions', []);
    fixture.componentRef.setInput('petId', '1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
