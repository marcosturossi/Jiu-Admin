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
});
