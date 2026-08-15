import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { OnboardingBasicFormComponent } from './onboarding-basic-form.component';
import { StudentBasicInfo } from './student-onboarding.component';

const EMPTY_INFO: StudentBasicInfo = {
  name: '', email: '', phone: '', cpf: '', dateOfBirth: '', gender: '', address: '', city: '', state: '', zipCode: '',
};

describe('OnboardingBasicFormComponent', () => {
  let component: OnboardingBasicFormComponent;
  let fixture: ComponentFixture<OnboardingBasicFormComponent>;
  let componentRef: ComponentRef<OnboardingBasicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingBasicFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingBasicFormComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    componentRef.setInput('data', { ...EMPTY_INFO });
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should emit a partial dataChange when a field updates', () => {
    spyOn(component.dataChange, 'emit');
    (component as any).onDataChange('name', 'John Doe');
    expect(component.dataChange.emit).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('should emit only the changed field for other fields too', () => {
    spyOn(component.dataChange, 'emit');
    (component as any).onDataChange('email', 'john@example.com');
    expect(component.dataChange.emit).toHaveBeenCalledWith({ email: 'john@example.com' });
  });

  it('should render the name input field', () => {
    const nameInput = fixture.nativeElement.querySelector('#name') as HTMLInputElement;
    expect(nameInput).toBeTruthy();
  });
});
