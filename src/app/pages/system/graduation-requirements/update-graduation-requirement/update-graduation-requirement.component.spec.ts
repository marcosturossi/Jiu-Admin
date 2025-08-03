import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateGraduationRequirementComponent } from './update-graduation-requirement.component';

describe('UpdateGraduationRequirementComponent', () => {
  let component: UpdateGraduationRequirementComponent;
  let fixture: ComponentFixture<UpdateGraduationRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateGraduationRequirementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateGraduationRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
