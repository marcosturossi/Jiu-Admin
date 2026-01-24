import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalClearancesComponent } from './medical-clearances.component';

describe('MedicalClearancesComponent', () => {
  let component: MedicalClearancesComponent;
  let fixture: ComponentFixture<MedicalClearancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalClearancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalClearancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
