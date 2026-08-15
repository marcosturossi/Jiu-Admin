import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { StudentOnboardingComponent } from './student-onboarding.component';
import { SubnavService } from '../../../services/subnav.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { BeltService } from '../../../generated_services/api/belt.service';
import { FeePlanService } from '../../../generated_services/api/feePlan.service';
import { ContractService } from '../../../generated_services/api/contract.service';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

describe('StudentOnboardingComponent', () => {
  let component: StudentOnboardingComponent;
  let fixture: ComponentFixture<StudentOnboardingComponent>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let beltService: jasmine.SpyObj<BeltService>;
  let feePlanService: jasmine.SpyObj<FeePlanService>;
  let contractService: jasmine.SpyObj<ContractService>;
  let graduationService: jasmine.SpyObj<GraduationService>;
  let medicalClearanceService: jasmine.SpyObj<MedicalClearanceService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    subnavService = jasmine.createSpyObj('SubnavService', ['setTitle']);
    studentsService = jasmine.createSpyObj('StudentsService', ['apiStudentsPost']);
    beltService = jasmine.createSpyObj('BeltService', ['apiBeltGet']);
    feePlanService = jasmine.createSpyObj('FeePlanService', ['apiFeePlanGet']);
    contractService = jasmine.createSpyObj('ContractService', ['apiContractPost']);
    graduationService = jasmine.createSpyObj('GraduationService', ['apiGraduationPost']);
    medicalClearanceService = jasmine.createSpyObj('MedicalClearanceService', ['apiMedicalClearancePost', 'apiMedicalClearanceIdAttachmentPost']);
    notificationService = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning', 'showInfo']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    beltService.apiBeltGet.and.returnValue(of({ items: [] } as any));
    feePlanService.apiFeePlanGet.and.returnValue(of({ items: [] } as any));

    await TestBed.configureTestingModule({
      imports: [StudentOnboardingComponent, CommonModule, FormsModule],
      providers: [
        { provide: SubnavService, useValue: subnavService },
        { provide: StudentsService, useValue: studentsService },
        { provide: BeltService, useValue: beltService },
        { provide: FeePlanService, useValue: feePlanService },
        { provide: ContractService, useValue: contractService },
        { provide: GraduationService, useValue: graduationService },
        { provide: MedicalClearanceService, useValue: medicalClearanceService },
        { provide: NotificationService, useValue: notificationService },
        { provide: Router, useValue: router },
        provideHttpClient(),
      ],
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

  it('should load belts and fee plans on init', () => {
    expect(beltService.apiBeltGet).toHaveBeenCalled();
    expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
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

  it('should update contract info', () => {
    component['updateContractInfo']({ feePlanId: 'plan-1' });
    expect(component['contractInfo']().feePlanId).toBe('plan-1');
  });

  it('should update medical info', () => {
    component['updateMedicalInfo']({ hasClearance: true });
    expect(component['medicalInfo']().hasClearance).toBeTrue();
  });

  it('should update termsAccepted', () => {
    component['updateTermsAccepted'](true);
    expect(component['termsAccepted']()).toBeTrue();
  });

  it('should prepend a newly created belt to the belts list', () => {
    component['onBeltCreated']({ id: 'b1', color: 'Azul' } as any);
    expect(component['belts']()[0].id).toBe('b1');
  });

  it('should prepend a newly created fee plan to the feePlans list', () => {
    component['onFeePlanCreated']({ id: 'p1', name: 'Mensal' } as any);
    expect(component['feePlans']()[0].id).toBe('p1');
  });

  it('should calculate progress correctly', () => {
    const progress = component['getStepProgress']();
    expect(progress).toBe(25); // Step 1 of 4
  });

  describe('submitForm', () => {
    beforeEach(() => {
      component['basicInfo'].set({
        name: 'John Doe', email: 'john@example.com', phone: '123', cpf: '000',
        dateOfBirth: '2000-01-01', gender: 'M', address: '', city: '', state: '', zipCode: '',
      });
    });

    it('should block submission and show an error when terms are not accepted', async () => {
      await component['submitForm']();
      expect(component['errorMessage']()).toContain('Confirme');
      expect(studentsService.apiStudentsPost).not.toHaveBeenCalled();
    });

    it('should create the student and navigate on success with no belt/contract/medical', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(studentsService.apiStudentsPost).toHaveBeenCalledWith(jasmine.objectContaining({
        email: 'john@example.com', firstName: 'John', lastName: 'Doe', cpf: '000',
      }));
      expect(notificationService.showSuccess).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/system/students/details', 'student-1']);
      expect(component['isSubmitting']()).toBeFalse();
      expect(component['currentStep']()).toBe(1);
    });

    it('should show an error and stop submitting when student creation fails', async () => {
      studentsService.apiStudentsPost.and.returnValue(throwError(() => new Error('fail')));
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(component['errorMessage']()).toBeTruthy();
      expect(component['isSubmitting']()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should register a graduation when a belt is selected', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      graduationService.apiGraduationPost.and.returnValue(of({} as any));
      component['beltInfo'].set({ beltId: 'belt-1', startDate: '2026-01-01' });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(graduationService.apiGraduationPost).toHaveBeenCalledWith(jasmine.objectContaining({
        studentId: 'student-1', beltId: 'belt-1',
      }));
      expect(notificationService.showSuccess).toHaveBeenCalled();
    });

    it('should warn with follow-up issues when the graduation registration fails', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      graduationService.apiGraduationPost.and.returnValue(throwError(() => new Error('fail')));
      component['beltInfo'].set({ beltId: 'belt-1', startDate: '2026-01-01' });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(notificationService.showWarning).toHaveBeenCalledWith('Aluno Cadastrado com Pendências', jasmine.stringContaining('Faixa não registrada'));
    });

    it('should create a contract when a fee plan is selected', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      contractService.apiContractPost.and.returnValue(of({} as any));
      component['contractInfo'].set({ feePlanId: 'plan-1', startDate: '2026-01-01' });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(contractService.apiContractPost).toHaveBeenCalledWith(jasmine.objectContaining({
        personId: 'student-1', feePlanId: 'plan-1',
      }));
      expect(notificationService.showSuccess).toHaveBeenCalled();
    });

    it('should warn with follow-up issues when the contract creation fails', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      contractService.apiContractPost.and.returnValue(throwError(() => new Error('fail')));
      component['contractInfo'].set({ feePlanId: 'plan-1', startDate: '2026-01-01' });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(notificationService.showWarning).toHaveBeenCalledWith('Aluno Cadastrado com Pendências', jasmine.stringContaining('Contrato não criado'));
    });

    it('should register a medical clearance and attach the file when present', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      medicalClearanceService.apiMedicalClearancePost.and.returnValue(of({ id: 'clearance-1' } as any));
      medicalClearanceService.apiMedicalClearanceIdAttachmentPost.and.returnValue(of({} as any));
      const file = new File(['data'], 'exam.pdf');
      component['medicalInfo'].set({ hasClearance: true, expiresAt: '2027-01-01', isApproved: true, clearanceFile: file });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(medicalClearanceService.apiMedicalClearancePost).toHaveBeenCalledWith(jasmine.objectContaining({ studentId: 'student-1', isApproved: true }));
      expect(medicalClearanceService.apiMedicalClearanceIdAttachmentPost).toHaveBeenCalledWith('clearance-1', file);
      expect(notificationService.showSuccess).toHaveBeenCalled();
    });

    it('should warn with follow-up issues when the medical clearance registration fails', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      medicalClearanceService.apiMedicalClearancePost.and.returnValue(throwError(() => new Error('fail')));
      component['medicalInfo'].set({ hasClearance: true, expiresAt: '', isApproved: false, clearanceFile: null });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(notificationService.showWarning).toHaveBeenCalledWith('Aluno Cadastrado com Pendências', jasmine.stringContaining('Atestado médico não registrado'));
    });

    it('should warn with follow-up issues when the attachment upload fails', async () => {
      studentsService.apiStudentsPost.and.returnValue(of({ id: 'student-1' } as any));
      medicalClearanceService.apiMedicalClearancePost.and.returnValue(of({ id: 'clearance-1' } as any));
      medicalClearanceService.apiMedicalClearanceIdAttachmentPost.and.returnValue(throwError(() => new Error('fail')));
      const file = new File(['data'], 'exam.pdf');
      component['medicalInfo'].set({ hasClearance: true, expiresAt: '', isApproved: false, clearanceFile: file });
      component['termsAccepted'].set(true);

      await component['submitForm']();

      expect(notificationService.showWarning).toHaveBeenCalledWith('Aluno Cadastrado com Pendências', jasmine.stringContaining('arquivo não foi anexado'));
    });
  });
});
