import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { CreateMedicalClearanceComponent } from './create-medical-clearance.component';

describe('CreateMedicalClearanceComponent', () => {
  let component: CreateMedicalClearanceComponent;
  let fixture: ComponentFixture<CreateMedicalClearanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMedicalClearanceComponent],
      providers: [provideHttpClient(), MessageService]
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
