import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { CreateSupplierComponent } from './create-supplier.component';
import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateSupplierComponent', () => {
  let component: CreateSupplierComponent;
  let fixture: ComponentFixture<CreateSupplierComponent>;
  let supplierSpy: jasmine.SpyObj<SupplierService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    supplierSpy = jasmine.createSpyObj('SupplierService', ['apiSupplierPost']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateSupplierComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: SupplierService, useValue: supplierSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSupplierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should show error when form is invalid and save is called', () => {
    (component as any).save();
    expect(notifySpy.showError).toHaveBeenCalled();
    expect(supplierSpy.apiSupplierPost).not.toHaveBeenCalled();
  });

  it('should call apiSupplierPost on valid form and show success', () => {
    supplierSpy.apiSupplierPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ name: 'Fornecedor X', email: 'fx@test.com' });
    (component as any).save();
    expect(supplierSpy.apiSupplierPost).toHaveBeenCalled();
    expect(notifySpy.showSuccess).toHaveBeenCalled();
  });

  it('should show error on apiSupplierPost failure', () => {
    supplierSpy.apiSupplierPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ name: 'Fornecedor X', email: 'fx@test.com' });
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
});
