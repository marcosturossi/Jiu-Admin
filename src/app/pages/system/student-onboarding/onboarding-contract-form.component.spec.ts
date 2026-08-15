import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { OnboardingContractFormComponent } from './onboarding-contract-form.component';
import { StudentContractInfo } from './student-onboarding.component';
import { ShowFeePlanDTO } from '../../../generated_services/model/showFeePlanDTO';
import { NotificationService } from '../../../services/notification.service';

const EMPTY_INFO: StudentContractInfo = { feePlanId: '', startDate: '2026-01-01' };

describe('OnboardingContractFormComponent', () => {
  let component: OnboardingContractFormComponent;
  let fixture: ComponentFixture<OnboardingContractFormComponent>;
  let componentRef: ComponentRef<OnboardingContractFormComponent>;

  beforeEach(async () => {
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [OnboardingContractFormComponent],
      providers: [
        provideHttpClient(),
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingContractFormComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    componentRef.setInput('data', { ...EMPTY_INFO });
    componentRef.setInput('feePlans', []);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should emit a partial dataChange when a field updates', () => {
    spyOn(component.dataChange, 'emit');
    (component as any).onDataChange('feePlanId', 'plan-1');
    expect(component.dataChange.emit).toHaveBeenCalledWith({ feePlanId: 'plan-1' });
  });

  it('should not show the create-fee-plan modal by default', () => {
    expect((component as any).openedCreateFeePlan()).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-create-fee-plan')).toBeNull();
  });

  it('should open the create-fee-plan modal when requested', () => {
    (component as any).openedCreateFeePlan.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal.show')).toBeTruthy();
  });

  it('should close the modal, patch feePlanId and bubble up feePlanCreated when a plan is created', () => {
    spyOn(component.feePlanCreated, 'emit');
    (component as any).openedCreateFeePlan.set(true);
    const plan: ShowFeePlanDTO = { id: 'plan-2', name: 'Mensal' } as any;

    (component as any).onFeePlanCreated(plan);

    expect((component as any).openedCreateFeePlan()).toBeFalse();
    expect(component.feePlanCreated.emit).toHaveBeenCalledWith(plan);
  });

  it('should render fee plan options from the feePlans input', () => {
    componentRef.setInput('feePlans', [
      { id: 'p1', name: 'Mensal', price: 100, monthDuration: 1 },
      { id: 'p2', name: 'Trimestral', price: 270, monthDuration: 3 },
    ] as ShowFeePlanDTO[]);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('#feePlanId option');
    expect(options.length).toBe(3);
  });
});
