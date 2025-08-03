import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGraduationRequirementComponent } from './create-graduation-requirement.component';

describe('CreateGraduationRequirementComponent', () => {
  let component: CreateGraduationRequirementComponent;
  let fixture: ComponentFixture<CreateGraduationRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGraduationRequirementComponent]
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
