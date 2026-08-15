import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateFeePlanComponent } from './create-fee-plan.component';
import { FeePlanService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateFeePlanComponent', () => {
  let component: CreateFeePlanComponent;
  let fixture: ComponentFixture<CreateFeePlanComponent>;
  let service: jasmine.SpyObj<FeePlanService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('FeePlanService', ['apiFeePlanPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateFeePlanComponent],
      providers: [
        { provide: FeePlanService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateFeePlanComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(FeePlanService) as jasmine.SpyObj<FeePlanService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should default monthDuration to 1', () => {
    expect((component as any).form.value.monthDuration).toBe(1);
  });

  it('should have an invalid form on init (name/price required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should reject monthDuration below 1', () => {
    const control = (component as any).form.get('monthDuration');
    control.setValue(0);
    control.markAsTouched();
    expect(control.valid).toBeFalse();
  });

  it('should block save and show an error when the form is invalid', () => {
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
    expect(service.apiFeePlanPost).not.toHaveBeenCalled();
  });

  it('should create the plan and emit feePlanCreated on success', () => {
    const created = { id: 'p1', name: 'Mensal', price: 150 } as any;
    service.apiFeePlanPost.and.returnValue(of(created));
    spyOn(component.feePlanCreated, 'emit');
    (component as any).form.patchValue({ name: 'Mensal', monthDuration: 1, price: 150 });

    (component as any).save();

    expect(service.apiFeePlanPost).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Mensal',
      monthDuration: 1,
      price: 150,
    }));
    expect(component.feePlanCreated.emit).toHaveBeenCalledWith(created);
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should show an error and stop saving when the request fails', () => {
    service.apiFeePlanPost.and.returnValue(throwError(() => new Error('fail')));
    (component as any).form.patchValue({ name: 'Mensal', monthDuration: 1, price: 150 });

    (component as any).save();

    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar!', jasmine.any(String));
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should emit closeEvent when cancel is clicked', () => {
    spyOn(component.closeEvent, 'emit');
    (component as any).close();
    expect(component.closeEvent.emit).toHaveBeenCalled();
  });
});
