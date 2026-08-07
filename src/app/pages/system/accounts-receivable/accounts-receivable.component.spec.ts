import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AccountsReceivableComponent } from './accounts-receivable.component';

registerLocaleData(localePt, 'pt-BR');
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowAccountsReceivableDTO, ShowTransactionCategoryDTO } from '../../../generated_services';
import { TransactionType } from '../../../generated_services/model/transactionType';

const MOCK_ITEM: ShowAccountsReceivableDTO = { id: 't1', description: 'Mensalidade março', amount: 150 as any, type: TransactionType.Income, transactionCategoryId: 'cat1' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_ITEM, id: `ar${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});
const MOCK_CATEGORIES: ShowTransactionCategoryDTO[] = [{ id: 'cat1', name: 'Mensalidades' }];
const MOCK_CATEGORY_RESPONSE = { items: MOCK_CATEGORIES, totalCount: 1, totalPages: 1 };

describe('AccountsReceivableComponent', () => {
  let component: AccountsReceivableComponent;
  let fixture: ComponentFixture<AccountsReceivableComponent>;
  let accountsReceivableService: jasmine.SpyObj<AccountsReceivableService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableGet', 'apiAccountsReceivableChargeIdDelete', 'apiAccountsReceivableIdDelete']);
    const categorySpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryGet']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    // page is at arg index 8 (0-based), pageSize at 9
    arSpy.apiAccountsReceivableGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[8] ?? 1), Number(args[9] ?? 10))));
    categorySpy.apiTransactionCategoryGet.and.returnValue(of(MOCK_CATEGORY_RESPONSE));
    studentsSpy.apiStudentsGet.and.returnValue(of({ items: [], totalCount: 0, totalPages: 1 }));

    await TestBed.configureTestingModule({
      imports: [AccountsReceivableComponent],
      providers: [
        provideHttpClient(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: TransactionCategoryService, useValue: categorySpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsReceivableComponent);
    component = fixture.componentInstance;
    accountsReceivableService = TestBed.inject(AccountsReceivableService) as jasmine.SpyObj<AccountsReceivableService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update page and reload on onPageChange', () => {
    accountsReceivableService.apiAccountsReceivableGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(accountsReceivableService.apiAccountsReceivableGet).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    accountsReceivableService.apiAccountsReceivableGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(accountsReceivableService.apiAccountsReceivableGet).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
  });

  describe('filters', () => {
    beforeEach(() => accountsReceivableService.apiAccountsReceivableGet.calls.reset());

    it('should pass the selected status and reset to page 1 on onFilterChange', () => {
      (component as any).currentPage.set(3);
      (component as any).onFilterChange({
        text: '',
        conditions: [{ field: (component as any).filterFields[1], operator: 'eq', value: 'Paid' }],
      });
      expect((component as any).currentPage()).toBe(1);
      const args = accountsReceivableService.apiAccountsReceivableGet.calls.mostRecent().args;
      expect(args[14]).toBe('Paid'); // status is arg index 14
    });

    it('should pass the selected student id on onStudentSelected', () => {
      (component as any).onStudentSelected({ id: 'student-1', label: 'Fulano' });
      expect((component as any).currentPage()).toBe(1);
      const args = accountsReceivableService.apiAccountsReceivableGet.calls.mostRecent().args;
      expect(args[12]).toBe('student-1'); // studentId is arg index 12
    });

    it('should pass overdueOnly=true when the toggle is on', () => {
      (component as any).overdueOnly.set(true);
      (component as any).onOverdueOnlyChange();
      const args = accountsReceivableService.apiAccountsReceivableGet.calls.mostRecent().args;
      expect(args[15]).toBe(true); // overdueOnly is arg index 15
    });

    it('should omit overdueOnly when the toggle is off', () => {
      (component as any).overdueOnly.set(false);
      (component as any).onOverdueOnlyChange();
      const args = accountsReceivableService.apiAccountsReceivableGet.calls.mostRecent().args;
      expect(args[15]).toBeUndefined();
    });
  });

  describe('getTypeLabel', () => {
    it('should return correct labels', () => {
      expect((component as any).getTypeLabel(TransactionType.Income)).toBe('Receita');
      expect((component as any).getTypeLabel(TransactionType.Refund)).toBe('Reembolso');
      expect((component as any).getTypeLabel(TransactionType.Adjustment)).toBe('Ajuste');
      expect((component as any).getTypeLabel(undefined)).toBe('—');
    });
  });

  describe('getCategoryName', () => {
    it('should return category name from loaded categories', () => {
      expect((component as any).getCategoryName('cat1')).toBe('Mensalidades');
    });

    it('should return "—" when categoryId is null', () => {
      expect((component as any).getCategoryName(null)).toBe('—');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      accountsReceivableService.apiAccountsReceivableIdDelete.and.returnValue(of(null as any));
      accountsReceivableService.apiAccountsReceivableChargeIdDelete.and.returnValue(of(null as any));
      accountsReceivableService.apiAccountsReceivableGet.calls.reset();
    });

    // MOCK_ITEM has no contractId, so delete() routes to the standalone-entry endpoint.
    it('should delete a standalone item (no contractId) via apiAccountsReceivableIdDelete', async () => {
      await (component as any).delete(MOCK_ITEM);
      expect(accountsReceivableService.apiAccountsReceivableIdDelete).toHaveBeenCalledWith(MOCK_ITEM.id!);
      expect(accountsReceivableService.apiAccountsReceivableChargeIdDelete).not.toHaveBeenCalled();
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(accountsReceivableService.apiAccountsReceivableGet).toHaveBeenCalled();
    });

    // Contract-generated installments carry a contractId and must go through the charge endpoint instead.
    it('should delete a contract-generated charge (with contractId) via apiAccountsReceivableChargeIdDelete', async () => {
      const chargeItem = { ...MOCK_ITEM, contractId: 'contract-1' };
      await (component as any).delete(chargeItem);
      expect(accountsReceivableService.apiAccountsReceivableChargeIdDelete).toHaveBeenCalledWith(chargeItem.id!);
      expect(accountsReceivableService.apiAccountsReceivableIdDelete).not.toHaveBeenCalled();
      expect(ns.showSuccess).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_ITEM);
      expect(accountsReceivableService.apiAccountsReceivableIdDelete).not.toHaveBeenCalled();
      expect(accountsReceivableService.apiAccountsReceivableChargeIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      accountsReceivableService.apiAccountsReceivableIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_ITEM);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
