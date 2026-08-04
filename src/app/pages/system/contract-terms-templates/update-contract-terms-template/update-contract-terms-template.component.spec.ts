import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateContractTermsTemplateComponent } from './update-contract-terms-template.component';
import { ContractTermsTemplateService } from '../../../../generated_services/api/contractTermsTemplate.service';
import { ShowContractTermsTemplateDTO } from '../../../../generated_services/model/showContractTermsTemplateDTO';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_TEMPLATE: ShowContractTermsTemplateDTO = {
  id: 't1',
  name: 'Padrão',
  text: 'Cláusulas padrão',
};

describe('UpdateContractTermsTemplateComponent', () => {
  let component: UpdateContractTermsTemplateComponent;
  let fixture: ComponentFixture<UpdateContractTermsTemplateComponent>;
  let componentRef: ComponentRef<UpdateContractTermsTemplateComponent>;
  let contractTermsTemplateService: jasmine.SpyObj<ContractTermsTemplateService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ContractTermsTemplateService', ['apiContractTermsTemplateIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateContractTermsTemplateComponent],
      providers: [
        { provide: ContractTermsTemplateService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateContractTermsTemplateComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    contractTermsTemplateService = TestBed.inject(ContractTermsTemplateService) as jasmine.SpyObj<ContractTermsTemplateService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('template', MOCK_TEMPLATE);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input template', () => {
    expect((component as any).form.get('name')?.value).toBe('Padrão');
    expect((component as any).form.get('text')?.value).toBe('Cláusulas padrão');
  });

  it('should have valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('name')?.setValue('');
    (component as any).save();
    expect(contractTermsTemplateService.apiContractTermsTemplateIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiContractTermsTemplateIdPut with correct id on valid save', () => {
    contractTermsTemplateService.apiContractTermsTemplateIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(contractTermsTemplateService.apiContractTermsTemplateIdPut).toHaveBeenCalledWith('t1', jasmine.any(Object));
  });

  it('should emit templateUpdated and show success on successful save', () => {
    contractTermsTemplateService.apiContractTermsTemplateIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.templateUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    contractTermsTemplateService.apiContractTermsTemplateIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Modelo!', jasmine.any(String));
  });
});
