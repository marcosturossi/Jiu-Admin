import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { DetailSupplierComponent } from './detail-supplier.component';
import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { AccountsPayableService } from '../../../../generated_services/api/accountsPayable.service';
import { NotificationService } from '../../../../services/notification.service';
import { SubnavService } from '../../../../services/subnav.service';

const MOCK_SUPPLIER = {
  id: 'test-id',
  personId: 'person-test-id',
  createdAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
};

describe('DetailSupplierComponent', () => {
  let component: DetailSupplierComponent;
  let fixture: ComponentFixture<DetailSupplierComponent>;
  let supplierSpy: jasmine.SpyObj<SupplierService>;
  let accountsPayableSpy: jasmine.SpyObj<AccountsPayableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let subnavSpy: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    supplierSpy = jasmine.createSpyObj('SupplierService', ['apiSupplierIdGet']);
    accountsPayableSpy = jasmine.createSpyObj('AccountsPayableService', ['apiAccountsPayableGet']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess']);
    subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);

    supplierSpy.apiSupplierIdGet.and.returnValue(of(MOCK_SUPPLIER) as any);
    accountsPayableSpy.apiAccountsPayableGet.and.returnValue(of({ items: [], totalCount: 0, totalPages: 0 }) as any);

    await TestBed.configureTestingModule({
      imports: [DetailSupplierComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: SupplierService, useValue: supplierSpy },
        { provide: AccountsPayableService, useValue: accountsPayableSpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: SubnavService, useValue: subnavSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'test-id' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailSupplierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => {
    expect(subnavSpy.setTitle).toHaveBeenCalledWith('Detalhes do Fornecedor');
  });

  it('should load supplier on init', () => {
    expect(supplierSpy.apiSupplierIdGet).toHaveBeenCalledWith('test-id');
    expect((component as any).supplier()).toEqual(MOCK_SUPPLIER);
  });

  it('should load accounts payable after supplier loads', () => {
    expect(accountsPayableSpy.apiAccountsPayableGet).toHaveBeenCalled();
  });

  it('should show error notification when supplier load fails', () => {
    supplierSpy.apiSupplierIdGet.and.returnValue(throwError(() => new Error()));
    (component as any).loadSupplier();
    expect(notifySpy.showError).toHaveBeenCalled();
  });

  it('should open update modal', () => {
    expect((component as any).openedUpdate()).toBeFalse();
    (component as any).openUpdate();
    expect((component as any).openedUpdate()).toBeTrue();
  });

  it('should close update modal and reload on onSupplierUpdated', () => {
    (component as any).openedUpdate.set(true);
    supplierSpy.apiSupplierIdGet.calls.reset();
    (component as any).onSupplierUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(supplierSpy.apiSupplierIdGet).toHaveBeenCalled();
  });
});
