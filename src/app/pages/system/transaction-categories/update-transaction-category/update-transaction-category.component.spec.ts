import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UpdateTransactionCategoryComponent } from './update-transaction-category.component';
import { TransactionCategoryService, ShowTransactionCategoryDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_CATEGORY: ShowTransactionCategoryDTO = {
  id: 'c1', name: 'Mensalidades', isActive: true,
};

describe('UpdateTransactionCategoryComponent', () => {
  let component: UpdateTransactionCategoryComponent;
  let fixture: ComponentFixture<UpdateTransactionCategoryComponent>;
  let componentRef: ComponentRef<UpdateTransactionCategoryComponent>;
  let service: jasmine.SpyObj<TransactionCategoryService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [UpdateTransactionCategoryComponent],
      providers: [
        { provide: TransactionCategoryService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateTransactionCategoryComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    service = TestBed.inject(TransactionCategoryService) as jasmine.SpyObj<TransactionCategoryService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('category', MOCK_CATEGORY);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should patch the form from the input category', () => {
    expect((component as any).form.value.name).toBe('Mensalidades');
    expect((component as any).form.value.isActive).toBeTrue();
  });

  it('should have a valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should block save and show an error when the form is invalid', () => {
    (component as any).form.get('name')?.setValue('');
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
    expect(service.apiTransactionCategoryIdPut).not.toHaveBeenCalled();
  });

  it('should update the category and emit categoryUpdated on success', () => {
    service.apiTransactionCategoryIdPut.and.returnValue(of({} as any));
    spyOn(component.categoryUpdated, 'emit');
    (component as any).form.patchValue({ name: 'Mensalidades Editado' });

    (component as any).save();

    expect(service.apiTransactionCategoryIdPut).toHaveBeenCalledWith('c1', jasmine.objectContaining({ name: 'Mensalidades Editado' }));
    expect(component.categoryUpdated.emit).toHaveBeenCalled();
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should show an error and stop saving when the request fails', () => {
    service.apiTransactionCategoryIdPut.and.returnValue(throwError(() => new Error('fail')));
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
