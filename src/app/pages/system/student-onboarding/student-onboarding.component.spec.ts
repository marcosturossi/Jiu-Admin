import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentOnboardingComponent } from './student-onboarding.component';
import { SubnavService } from '../../../services/subnav.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('StudentOnboardingComponent', () => {
  let component: StudentOnboardingComponent;
  let fixture: ComponentFixture<StudentOnboardingComponent>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    subnavService = jasmine.createSpyObj('SubnavService', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [StudentOnboardingComponent, CommonModule, FormsModule],
      providers: [{ provide: SubnavService, useValue: subnavService }],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with step 1', () => {
    expect(component['currentStep']()).toBe(1);
  });

  it('should set title on init', () => {
    expect(subnavService.setTitle).toHaveBeenCalledWith('Cadastro de Alunos');
  });

  it('should navigate to next step', () => {
    component['nextStep']();
    expect(component['currentStep']()).toBe(2);
  });

  it('should navigate to previous step', () => {
    component['nextStep']();
    component['previousStep']();
    expect(component['currentStep']()).toBe(1);
  });

  it('should not go below step 1', () => {
    component['previousStep']();
    expect(component['currentStep']()).toBe(1);
  });

  it('should not go above max steps', () => {
    for (let i = 0; i < 10; i++) {
      component['nextStep']();
    }
    expect(component['currentStep']()).toBeLessThanOrEqual(4);
  });

  it('should update basic info', () => {
    component['updateBasicInfo']({ name: 'John Doe' });
    expect(component['basicInfo']().name).toBe('John Doe');
  });

  it('should update belt info', () => {
    component['updateBeltInfo']({ beltId: 'blue' });
    expect(component['beltInfo']().beltId).toBe('blue');
  });

  it('should calculate progress correctly', () => {
    const progress = component['getStepProgress']();
    expect(progress).toBe(25); // Step 1 of 4
  });
});
