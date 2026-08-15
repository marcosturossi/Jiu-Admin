import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UpdateFeePlanComponent } from './update-fee-plan.component';
import { FeePlanService, ShowFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_PLAN: ShowFeePlanDTO = {
  id: 'p1', name: 'Mensal', description: 'Plano padrão', monthDuration: 1 as any, price: 150 as any, isActive: true,
};

describe('UpdateFeePlanComponent', () => {
  let component: UpdateFeePlanComponent;
  let fixture: ComponentFixture<UpdateFeePlanComponent>;
  let componentRef: ComponentRef<UpdateFeePlanComponent>;
  let service: jasmine.SpyObj<FeePlanService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('FeePlanService', ['apiFeePlanIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [UpdateFeePlanComponent],
      providers: [
        { provide: FeePlanService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateFeePlanComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    service = TestBed.inject(FeePlanService) as jasmine.SpyObj<FeePlanService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('feePlan', MOCK_PLAN);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should patch the form from the input plan', () => {
    expect((component as any).form.value.name).toBe('Mensal');
    expect((component as any).form.value.price).toBe(150);
    expect((component as any).form.value.isActive).toBeTrue();
  });

  it('should have a valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should reject monthDuration below 1', () => {
    const control = (component as any).form.get('monthDuration');
    control.setValue(0);
    control.markAsTouched();
    expect(control.valid).toBeFalse();
  });

  it('should block save and show an error when the form is invalid', () => {
    (component as any).form.get('name')?.setValue('');
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
    expect(service.apiFeePlanIdPut).not.toHaveBeenCalled();
  });

  it('should update the plan and emit feePlanUpdated on success', () => {
    service.apiFeePlanIdPut.and.returnValue(of({} as any));
    spyOn(component.feePlanUpdated, 'emit');
    (component as any).form.patchValue({ name: 'Mensal Editado' });

    (component as any).save();

    expect(service.apiFeePlanIdPut).toHaveBeenCalledWith('p1', jasmine.objectContaining({ name: 'Mensal Editado' }));
    expect(component.feePlanUpdated.emit).toHaveBeenCalled();
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should show an error and stop saving when the request fails', () => {
    service.apiFeePlanIdPut.and.returnValue(throwError(() => new Error('fail')));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar!', jasmine.any(String));
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should emit closeEvent when cancel is clicked', () => {
    spyOn(component.closeEvent, 'emit');
    (component as any).close();
    expect(component.closeEvent.emit).toHaveBeenCalled();
  });
});
