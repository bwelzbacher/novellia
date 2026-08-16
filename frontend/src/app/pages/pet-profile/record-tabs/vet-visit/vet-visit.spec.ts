import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetVisitComponent } from './vet-visit';

describe('VetVisitComponent', () => {
  let component: VetVisitComponent;
  let fixture: ComponentFixture<VetVisitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VetVisitComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VetVisitComponent);
    fixture.componentRef.setInput('petId', '1');
    fixture.componentRef.setInput('records', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
