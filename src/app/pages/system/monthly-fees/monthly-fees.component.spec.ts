import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { MonthlyFeesComponent } from './monthly-fees.component';

registerLocaleData(localePt, 'pt-BR');
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FeeStatus, PaginationMonthlyFeeDTO, ShowMonthlyFeeDTO } from '../../../generated_services';

const MOCK_FEE: ShowMonthlyFeeDTO = { id: 'fee1', contractId: 'c1', studentId: 's1', amount: 150, status: FeeStatus.NUMBER_0, dueDate: '2024-03-01' };
const MOCK_PAGINATION: PaginationMonthlyFeeDTO = { items: [MOCK_FEE], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1 };

describe('MonthlyFeesComponent', () => {
  let component: MonthlyFeesComponent;
  let fixture: ComponentFixture<MonthlyFeesComponent>;
  let feeService: jasmine.SpyObj<MonthlyFeeService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const feeSpy = jasmine.createSpyObj('MonthlyFeeService', ['apiMonthlyFeeGet', 'apiMonthlyFeeIdPayPatch']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    feeSpy.apiMonthlyFeeGet.and.returnValue(of(MOCK_PAGINATION));

    await TestBed.configureTestingModule({
      imports: [MonthlyFeesComponent, ReactiveFormsModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: MonthlyFeeService, useValue: feeSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyFeesComponent);
    component = fixture.componentInstance;
    feeService = TestBed.inject(MonthlyFeeService) as jasmine.SpyObj<MonthlyFeeService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Mensalidades'); });

  it('should load monthly fees on init', () => {
    expect(feeService.apiMonthlyFeeGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGINATION);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    feeService.apiMonthlyFeeGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    feeService.apiMonthlyFeeGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(feeService.apiMonthlyFeeGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    feeService.apiMonthlyFeeGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(feeService.apiMonthlyFeeGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onFilterChange', () => {
    (component as any).currentPage.set(3);
    feeService.apiMonthlyFeeGet.calls.reset();
    (component as any).onFilterChange();
    expect((component as any).currentPage()).toBe(1);
    expect(feeService.apiMonthlyFeeGet).toHaveBeenCalled();
  });

  describe('openPay', () => {
    it('should open pay dialog with selected fee and pre-fill amount', () => {
      (component as any).openPay(MOCK_FEE);
      expect((component as any).openedPay()).toBeTrue();
      expect((component as any).selected()).toEqual(MOCK_FEE);
      expect((component as any).payForm.value.paidAmount).toBe(MOCK_FEE.amount);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct labels for each status', () => {
      expect((component as any).getStatusLabel(FeeStatus.NUMBER_0)).toBe('Pendente');
      expect((component as any).getStatusLabel(FeeStatus.NUMBER_1)).toBe('Pago');
      expect((component as any).getStatusLabel(FeeStatus.NUMBER_2)).toBe('Atrasado');
      expect((component as any).getStatusLabel(FeeStatus.NUMBER_3)).toBe('Cancelado');
      expect((component as any).getStatusLabel(undefined)).toBe('—');
    });
  });

  describe('confirmPay', () => {
    beforeEach(() => {
      (component as any).openPay(MOCK_FEE);
      feeService.apiMonthlyFeeIdPayPatch.and.returnValue(of(null as any));
      feeService.apiMonthlyFeeGet.calls.reset();
    });

    it('should do nothing if form is invalid', () => {
      (component as any).payForm.patchValue({ paidAmount: null });
      (component as any).confirmPay();
      expect(feeService.apiMonthlyFeeIdPayPatch).not.toHaveBeenCalled();
    });

    it('should register payment and reload on success', () => {
      (component as any).payForm.patchValue({ paidAmount: 150, paidAt: '2024-03-15' });
      (component as any).confirmPay();
      expect(feeService.apiMonthlyFeeIdPayPatch).toHaveBeenCalledWith(MOCK_FEE.id!, jasmine.any(Object));
      expect(ns.showSuccess).toHaveBeenCalled();
      expect((component as any).openedPay()).toBeFalse();
      expect(feeService.apiMonthlyFeeGet).toHaveBeenCalled();
    });

    it('should show error notification on payment failure', () => {
      feeService.apiMonthlyFeeIdPayPatch.and.returnValue(throwError(() => new Error()));
      (component as any).payForm.patchValue({ paidAmount: 150, paidAt: '2024-03-15' });
      (component as any).confirmPay();
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
