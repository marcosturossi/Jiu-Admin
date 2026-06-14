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
import { FeeStatus } from '../../../generated_services/model/feeStatus';
import { ShowMonthlyFeeDTO } from '../../../generated_services/model/showMonthlyFeeDTO';

const MOCK_FEE: ShowMonthlyFeeDTO = { id: 'fee1', contractId: 'c1', studentId: 's1', amount: 150, status: FeeStatus.Pending, dueDate: '2024-03-01' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_FEE, id: `mf${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('MonthlyFeesComponent', () => {
  let component: MonthlyFeesComponent;
  let fixture: ComponentFixture<MonthlyFeesComponent>;
  let feeService: jasmine.SpyObj<MonthlyFeeService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const feeSpy = jasmine.createSpyObj('MonthlyFeeService', ['apiMonthlyFeeGet', 'apiMonthlyFeeIdPayPatch', 'apiMonthlyFeeIdReceiptPdfGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    feeSpy.apiMonthlyFeeGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[7] ?? 1), Number(args[8] ?? 10))));

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

  it('should update page and reload on onPageChange', () => {
    feeService.apiMonthlyFeeGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((feeService.apiMonthlyFeeGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    feeService.apiMonthlyFeeGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((feeService.apiMonthlyFeeGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  it('should reset to page 1 and reload on onFilterChange', () => {
    (component as any).currentPage.set(3);
    feeService.apiMonthlyFeeGet.calls.reset();
    (component as any).onFilterChange({ text: '', conditions: [] });
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
      expect((component as any).getStatusLabel(FeeStatus.Pending)).toBe('Pendente');
      expect((component as any).getStatusLabel(FeeStatus.Paid)).toBe('Pago');
      expect((component as any).getStatusLabel(FeeStatus.Overdue)).toBe('Atrasado');
      expect((component as any).getStatusLabel(FeeStatus.Cancelled)).toBe('Cancelado');
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

  describe('downloadReceipt', () => {
    const PAID_FEE: ShowMonthlyFeeDTO = { ...MOCK_FEE, id: 'fee2', status: FeeStatus.Paid, dueDate: '2024-03-01' };
    let mockBlob: Blob;
    let createObjectURLSpy: jasmine.Spy;
    let revokeObjectURLSpy: jasmine.Spy;
    let anchorClickSpy: jasmine.Spy;
    let anchorElement: HTMLAnchorElement;

    beforeEach(() => {
      mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      feeService.apiMonthlyFeeIdReceiptPdfGet.and.returnValue(of(mockBlob as any));

      anchorElement = document.createElement('a');
      anchorClickSpy = spyOn(anchorElement, 'click');
      spyOn(document, 'createElement').and.returnValue(anchorElement as any);

      createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
      revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
    });

    it('should call service with httpHeaderAccept application/pdf to get blob', () => {
      (component as any).downloadReceipt(PAID_FEE);
      expect(feeService.apiMonthlyFeeIdReceiptPdfGet).toHaveBeenCalledWith(
        PAID_FEE.id!,
        undefined,
        undefined,
        jasmine.objectContaining({ httpHeaderAccept: 'application/pdf' })
      );
    });

    it('should set selected fee and trigger download with correct filename', () => {
      (component as any).downloadReceipt(PAID_FEE);
      expect((component as any).selected()).toEqual(PAID_FEE);
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob as any);
      expect(anchorElement.download).toBe(`recibo-${PAID_FEE.dueDate}.pdf`);
      expect(anchorClickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url');
    });

    it('should show error notification if download fails', () => {
      feeService.apiMonthlyFeeIdReceiptPdfGet.and.returnValue(throwError(() => new Error()));
      (component as any).downloadReceipt(PAID_FEE);
      expect(ns.showError).toHaveBeenCalled();
    });

    it('should reset isDownloading after completion', () => {
      (component as any).downloadReceipt(PAID_FEE);
      expect((component as any).isDownloading()).toBeFalse();
    });
  });
});
