import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateContractTermsTemplateComponent } from './create-contract-terms-template.component';
import { ContractTermsTemplateService } from '../../../../generated_services/api/contractTermsTemplate.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateContractTermsTemplateComponent', () => {
  let component: CreateContractTermsTemplateComponent;
  let fixture: ComponentFixture<CreateContractTermsTemplateComponent>;
  let contractTermsTemplateService: jasmine.SpyObj<ContractTermsTemplateService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ContractTermsTemplateService', ['apiContractTermsTemplatePost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateContractTermsTemplateComponent],
      providers: [
        { provide: ContractTermsTemplateService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateContractTermsTemplateComponent);
    component = fixture.componentInstance;
    contractTermsTemplateService = TestBed.inject(ContractTermsTemplateService) as jasmine.SpyObj<ContractTermsTemplateService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (name/text required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ name: 'Padrão', text: 'Cláusulas' });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.patchValue({ name: '' });
    (component as any).save();
    expect(contractTermsTemplateService.apiContractTermsTemplatePost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiContractTermsTemplatePost on valid save', () => {
    contractTermsTemplateService.apiContractTermsTemplatePost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ name: 'Padrão', text: 'Cláusulas' });
    (component as any).save();
    expect(contractTermsTemplateService.apiContractTermsTemplatePost).toHaveBeenCalled();
  });

  it('should emit templateCreated and show success on successful save', () => {
    contractTermsTemplateService.apiContractTermsTemplatePost.and.returnValue(of({} as any));
    let emitted = false;
    component.templateCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ name: 'Padrão', text: 'Cláusulas' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    contractTermsTemplateService.apiContractTermsTemplatePost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ name: 'Padrão', text: 'Cláusulas' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Modelo!', jasmine.any(String));
  });
});
