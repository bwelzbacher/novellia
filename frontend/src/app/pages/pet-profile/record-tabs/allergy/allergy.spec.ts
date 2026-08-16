import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Allergy } from './allergy';

describe('Allergy', () => {
  let component: Allergy;
  let fixture: ComponentFixture<Allergy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Allergy],
    }).compileComponents();

    fixture = TestBed.createComponent(Allergy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
