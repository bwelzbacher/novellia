import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesComponent } from './notes';

describe('NotesComponent', () => {
  let component: NotesComponent;
  let fixture: ComponentFixture<NotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesComponent);
    fixture.componentRef.setInput('records', []);
    fixture.componentRef.setInput('conditions', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
