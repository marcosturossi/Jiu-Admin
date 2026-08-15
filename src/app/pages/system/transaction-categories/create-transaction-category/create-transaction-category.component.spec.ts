import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateTransactionCategoryComponent } from './create-transaction-category.component';
import { TransactionCategoryService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateTransactionCategoryComponent', () => {
  let component: CreateTransactionCategoryComponent;
  let fixture: ComponentFixture<CreateTransactionCategoryComponent>;
  let service: jasmine.SpyObj<TransactionCategoryService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateTransactionCategoryComponent],
      providers: [
        { provide: TransactionCategoryService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTransactionCategoryComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TransactionCategoryService) as jasmine.SpyObj<TransactionCategoryService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have an invalid form on init (name required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should block save and show an error when the form is invalid', () => {
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
    expect(service.apiTransactionCategoryPost).not.toHaveBeenCalled();
  });

  it('should create the category and emit categoryCreated on success', () => {
    const created = { id: 'c1', name: 'Mensalidades' } as any;
    service.apiTransactionCategoryPost.and.returnValue(of(created));
    spyOn(component.categoryCreated, 'emit');
    (component as any).form.patchValue({ name: 'Mensalidades' });

    (component as any).save();

    expect(service.apiTransactionCategoryPost).toHaveBeenCalledWith({ name: 'Mensalidades' });
    expect(component.categoryCreated.emit).toHaveBeenCalledWith(created);
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should show an error and stop saving when the request fails', () => {
    service.apiTransactionCategoryPost.and.returnValue(throwError(() => new Error('fail')));
    (component as any).form.patchValue({ name: 'Mensalidades' });

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
