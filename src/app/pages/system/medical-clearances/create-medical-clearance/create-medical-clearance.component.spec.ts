import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMedicalClearanceComponent } from './create-medical-clearance.component';

describe('CreateMedicalClearanceComponent', () => {
  let component: CreateMedicalClearanceComponent;
  let fixture: ComponentFixture<CreateMedicalClearanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMedicalClearanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMedicalClearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
