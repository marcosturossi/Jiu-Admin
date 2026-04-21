import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateGraduationRequirementComponent } from './create-graduation-requirement.component';
import { provideToastr } from 'ngx-toastr';

describe('CreateGraduationRequirementComponent', () => {
  let component: CreateGraduationRequirementComponent;
  let fixture: ComponentFixture<CreateGraduationRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGraduationRequirementComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGraduationRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
