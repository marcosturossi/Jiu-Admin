import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateMedicalClearanceComponent } from './update-medical-clearance.component';

describe('UpdateMedicalClearanceComponent', () => {
  let component: UpdateMedicalClearanceComponent;
  let fixture: ComponentFixture<UpdateMedicalClearanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateMedicalClearanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateMedicalClearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
