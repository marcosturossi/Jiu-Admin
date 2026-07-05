import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { SuppliersComponent } from './suppliers.component';
import { SupplierService } from '../../../generated_services/api/supplier.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

const MOCK_SUPPLIERS = Array.from({ length: 5 }, (_, i) => ({
  id: `sup${i + 1}`,
  personId: `person${i + 1}`,
  createdAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
}));

const buildResponse = () => ({
  items: MOCK_SUPPLIERS,
  totalCount: MOCK_SUPPLIERS.length,
  totalPages: 1,
});

describe('SuppliersComponent', () => {
  let component: SuppliersComponent;
  let fixture: ComponentFixture<SuppliersComponent>;
  let supplierService: jasmine.SpyObj<SupplierService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;
  let subnavSpy: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const supplierSpy = jasmine.createSpyObj('SupplierService', ['apiSupplierGet', 'apiSupplierIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);

    supplierSpy.apiSupplierGet.and.returnValue(of(buildResponse()) as any);

    await TestBed.configureTestingModule({
      imports: [SuppliersComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: SupplierService, useValue: supplierSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuppliersComponent);
    component = fixture.componentInstance;
    supplierService = TestBed.inject(SupplierService) as jasmine.SpyObj<SupplierService>;
    notifySpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavSpy = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => {
    expect(subnavSpy.setTitle).toHaveBeenCalledWith('Fornecedores');
  });

  it('should load suppliers on init', () => {
    expect(supplierService.apiSupplierGet).toHaveBeenCalled();
    expect((component as any).items()?.items?.length).toBe(5);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    supplierService.apiSupplierGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(notifySpy.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected supplier', () => {
    (component as any).openEdit(MOCK_SUPPLIERS[0]);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_SUPPLIERS[0]);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    supplierService.apiSupplierGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(supplierService.apiSupplierGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    supplierService.apiSupplierGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(supplierService.apiSupplierGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      supplierService.apiSupplierIdDelete.and.returnValue(of(null as any));
      supplierService.apiSupplierGet.calls.reset();
    });

    it('should delete supplier and reload on confirmation', () => {
      (component as any).delete(MOCK_SUPPLIERS[0]);
      expect(supplierService.apiSupplierIdDelete).toHaveBeenCalledWith('sup1');
      expect(notifySpy.showSuccess).toHaveBeenCalled();
      expect(supplierService.apiSupplierGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_SUPPLIERS[0]);
      expect(supplierService.apiSupplierIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      supplierService.apiSupplierIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_SUPPLIERS[0]);
      expect(notifySpy.showError).toHaveBeenCalled();
    });
  });
});
