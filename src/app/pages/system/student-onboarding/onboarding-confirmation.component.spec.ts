import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { OnboardingConfirmationComponent } from './onboarding-confirmation.component';
import { StudentBasicInfo, StudentBeltInfo, StudentContractInfo, StudentMedicalInfo } from './student-onboarding.component';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';
import { ShowFeePlanDTO } from '../../../generated_services/model/showFeePlanDTO';

const BASIC: StudentBasicInfo = {
  name: 'John Doe', email: 'john@example.com', phone: '123', cpf: '000', dateOfBirth: '', gender: '', address: '', city: '', state: '', zipCode: '',
};
const BELT: StudentBeltInfo = { beltId: '', startDate: '2026-01-01' };
const CONTRACT: StudentContractInfo = { feePlanId: '', startDate: '2026-01-01' };
const MEDICAL: StudentMedicalInfo = { hasClearance: false, expiresAt: '', isApproved: false, clearanceFile: null };

describe('OnboardingConfirmationComponent', () => {
  let component: OnboardingConfirmationComponent;
  let fixture: ComponentFixture<OnboardingConfirmationComponent>;
  let componentRef: ComponentRef<OnboardingConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingConfirmationComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    componentRef.setInput('basicInfo', { ...BASIC });
    componentRef.setInput('beltInfo', { ...BELT });
    componentRef.setInput('contractInfo', { ...CONTRACT });
    componentRef.setInput('medicalInfo', { ...MEDICAL });
    componentRef.setInput('belts', []);
    componentRef.setInput('feePlans', []);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should show a placeholder when no belt is selected', () => {
    expect(fixture.nativeElement.textContent).toContain('Nenhuma faixa selecionada.');
  });

  it('should show a placeholder when no fee plan is selected', () => {
    expect(fixture.nativeElement.textContent).toContain('Nenhum plano selecionado.');
  });

  it('getBeltName should resolve the belt color from the belts list', () => {
    componentRef.setInput('belts', [{ id: 'b1', color: 'Azul' }] as ShowBeltDTO[]);
    componentRef.setInput('beltInfo', { beltId: 'b1', startDate: '2026-01-01' });
    fixture.detectChanges();
    expect((component as any).getBeltName()).toBe('Azul');
  });

  it('getBeltName should fall back to a dash when the belt is not found', () => {
    componentRef.setInput('beltInfo', { beltId: 'missing', startDate: '2026-01-01' });
    fixture.detectChanges();
    expect((component as any).getBeltName()).toBe('-');
  });

  it('getFeePlanName should resolve the plan name from the feePlans list', () => {
    componentRef.setInput('feePlans', [{ id: 'p1', name: 'Mensal' }] as ShowFeePlanDTO[]);
    componentRef.setInput('contractInfo', { feePlanId: 'p1', startDate: '2026-01-01' });
    fixture.detectChanges();
    expect((component as any).getFeePlanName()).toBe('Mensal');
  });

  it('formatDate should return a dash for an empty date', () => {
    expect((component as any).formatDate('')).toBe('-');
  });

  it('formatDate should format a valid date in pt-BR', () => {
    expect((component as any).formatDate('2026-03-15')).toBe('15/03/2026');
  });

  it('should emit medicalDataChange when a medical field updates', () => {
    spyOn(component.medicalDataChange, 'emit');
    (component as any).updateMedical('hasClearance', true);
    expect(component.medicalDataChange.emit).toHaveBeenCalledWith({ hasClearance: true });
  });

  it('should emit medicalDataChange with the selected file', () => {
    spyOn(component.medicalDataChange, 'emit');
    const file = new File(['data'], 'exam.pdf', { type: 'application/pdf' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    (component as any).onFileChange({ target: input } as unknown as Event);
    expect(component.medicalDataChange.emit).toHaveBeenCalledWith({ clearanceFile: file });
  });

  it('should emit null clearanceFile when no file is selected', () => {
    spyOn(component.medicalDataChange, 'emit');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [] });
    (component as any).onFileChange({ target: input } as unknown as Event);
    expect(component.medicalDataChange.emit).toHaveBeenCalledWith({ clearanceFile: null });
  });

  it('should update local termsAccepted state and emit termsChange', () => {
    spyOn(component.termsChange, 'emit');
    (component as any).onTermsChange(true);
    expect((component as any).termsAccepted).toBeTrue();
    expect(component.termsChange.emit).toHaveBeenCalledWith(true);
  });

  it('should reveal the medical clearance fields once hasClearance is true', () => {
    componentRef.setInput('medicalInfo', { hasClearance: true, expiresAt: '', isApproved: false, clearanceFile: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#expiresAt')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#medicalClearance')).toBeTruthy();
  });
});
