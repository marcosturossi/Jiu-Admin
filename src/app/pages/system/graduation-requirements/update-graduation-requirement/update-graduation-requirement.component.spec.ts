import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { UpdateGraduationRequirementComponent } from './update-graduation-requirement.component';
import { provideToastr } from 'ngx-toastr';

describe('UpdateGraduationRequirementComponent', () => {
  let component: UpdateGraduationRequirementComponent;
  let fixture: ComponentFixture<UpdateGraduationRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateGraduationRequirementComponent],
      providers: [provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateGraduationRequirementComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('requirement', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
