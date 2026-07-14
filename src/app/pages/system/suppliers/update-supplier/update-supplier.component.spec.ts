import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { UpdateSupplierComponent } from './update-supplier.component';
import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_SUPPLIER = {
  id: 'sup-1',
  personId: 'person-1',
  createdAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
};

describe('UpdateSupplierComponent', () => {
  let component: UpdateSupplierComponent;
  let fixture: ComponentFixture<UpdateSupplierComponent>;
  let supplierSpy: jasmine.SpyObj<SupplierService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    supplierSpy = jasmine.createSpyObj('SupplierService', ['apiSupplierIdPut']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [UpdateSupplierComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: SupplierService, useValue: supplierSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateSupplierComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('supplier', MOCK_SUPPLIER);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should call apiSupplierIdPut on save and show success', () => {
    supplierSpy.apiSupplierIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(supplierSpy.apiSupplierIdPut).toHaveBeenCalledWith('sup-1', jasmine.any(Object));
    expect(notifySpy.showSuccess).toHaveBeenCalled();
  });

  it('should show error on apiSupplierIdPut failure', () => {
    supplierSpy.apiSupplierIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(notifySpy.showError).toHaveBeenCalled();
  });

  it('should add and remove address', () => {
    expect((component as any).addresses.length).toBe(0);
    (component as any).addAddress();
    expect((component as any).addresses.length).toBe(1);
    (component as any).removeAddress(0);
    expect((component as any).addresses.length).toBe(0);
  });

  it('should populate an editable individualPerson group when supplier is a Pessoa Física', () => {
    fixture.componentRef.setInput('supplier', {
      ...MOCK_SUPPLIER,
      individualPerson: { personId: 'ip-1', firstName: 'João', lastName: 'Silva', cpf: '12345678900', email: 'joao@test.com', phoneNumber: '11999998888' },
    });
    fixture.detectChanges();
    expect((component as any).companyPerson).toBeNull();
    expect((component as any).supplierTypeLabel()).toBe('Pessoa Física');
    const group = (component as any).individualPerson;
    expect(group.get('firstName').value).toBe('João');
    expect(group.get('lastName').value).toBe('Silva');
    expect(group.get('cpf').value).toBe('12345678900');
    expect(group.get('email').value).toBe('joao@test.com');
    expect(group.get('phoneNumber').value).toBe('11999998888');
  });

  it('should populate an editable companyPerson group when supplier is a Pessoa Jurídica', () => {
    fixture.componentRef.setInput('supplier', {
      ...MOCK_SUPPLIER,
      companyPerson: { personId: 'cp-1', name: 'Acme Ltda', cnpj: '12345678000199', email: 'contato@acme.com', phoneNumber: '1130001000' },
    });
    fixture.detectChanges();
    expect((component as any).individualPerson).toBeNull();
    expect((component as any).supplierTypeLabel()).toBe('Pessoa Jurídica');
    const group = (component as any).companyPerson;
    expect(group.get('name').value).toBe('Acme Ltda');
    expect(group.get('cnpj').value).toBe('12345678000199');
    expect(group.get('email').value).toBe('contato@acme.com');
    expect(group.get('phoneNumber').value).toBe('1130001000');
  });

  it('should send individualPerson data in the DTO on save', () => {
    supplierSpy.apiSupplierIdPut.and.returnValue(of({} as any));
    fixture.componentRef.setInput('supplier', {
      ...MOCK_SUPPLIER,
      individualPerson: { personId: 'ip-1', firstName: 'João', lastName: 'Silva', cpf: '12345678900', email: 'joao@test.com', phoneNumber: '11999998888' },
    });
    fixture.detectChanges();
    (component as any).individualPerson.patchValue({ firstName: 'Pedro' });

    (component as any).save();

    expect(supplierSpy.apiSupplierIdPut).toHaveBeenCalledWith('sup-1', jasmine.objectContaining({
      individualPerson: jasmine.objectContaining({ personId: 'ip-1', firstName: 'Pedro', lastName: 'Silva', cpf: '12345678900' }),
    }));
  });

  it('should block save when individualPerson is missing required fields', () => {
    fixture.componentRef.setInput('supplier', {
      ...MOCK_SUPPLIER,
      individualPerson: { personId: 'ip-1', firstName: 'João', lastName: 'Silva', cpf: '12345678900', email: 'joao@test.com', phoneNumber: '11999998888' },
    });
    fixture.detectChanges();
    (component as any).individualPerson.patchValue({ cpf: '' });

    (component as any).save();

    expect(supplierSpy.apiSupplierIdPut).not.toHaveBeenCalled();
    expect(notifySpy.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });
});
