import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { DeletePetSheet } from './delete-pet-sheet';

describe('DeletePetSheet', () => {
  let component: DeletePetSheet;
  let fixture: ComponentFixture<DeletePetSheet>;
  let dismissed: unknown;

  beforeEach(async () => {
    dismissed = undefined;

    await TestBed.configureTestingModule({
      imports: [DeletePetSheet],
      providers: [
        {
          provide: MatBottomSheetRef,
          useValue: { dismiss: (value: unknown) => (dismissed = value) },
        },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { petName: 'Rex' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeletePetSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dismisses with no result on cancel', () => {
    component.cancel();
    expect(dismissed).toBeUndefined();
  });

  it('dismisses with a null reason when none is selected', () => {
    component.confirm();
    expect(dismissed).toEqual({ reason: null });
  });

  it('dismisses with the selected reason on confirm', () => {
    component.onReasonChange({ value: 'DECEASED' } as never);
    component.confirm();
    expect(dismissed).toEqual({ reason: 'DECEASED' });
  });
});
