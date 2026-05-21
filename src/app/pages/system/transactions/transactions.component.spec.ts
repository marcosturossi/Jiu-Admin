import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { TransactionsComponent } from './transactions.component';

registerLocaleData(localePt, 'pt-BR');
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { CarlonGracieBackendFinancesApplicationDTOsShowTransactionDTO as ShowTransactionDTO, CarlonGracieBackendFinancesApplicationDTOsShowTransactionCategoryDTO as ShowTransactionCategoryDTO, CarlonGracieBackendSharedDomainEnumsTransactionType as TransactionType } from '../../../generated_services';

const MOCK_TRANSACTION: ShowTransactionDTO = { id: 't1', description: 'Mensalidade março', amount: 150, type: TransactionType.Debit, transactionCategoryId: 'cat1' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_TRANSACTION, id: `tx${i + 1}` }));
const MOCK_ODATA_RESPONSE = { value: MOCK_ITEMS };
const MOCK_PAGE = { items: MOCK_ITEMS.slice(0, 10), totalCount: 25, totalPages: 3, currentPage: 1 };
const MOCK_CATEGORIES: ShowTransactionCategoryDTO[] = [{ id: 'cat1', name: 'Mensalidades' }];
const MOCK_CATEGORY_ODATA = { '@odata.count': 1, value: MOCK_CATEGORIES };

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  let transactionService: jasmine.SpyObj<FinancialTransactionService>;
  let categoryService: jasmine.SpyObj<TransactionCategoryService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const transactionSpy = jasmine.createSpyObj('FinancialTransactionService', ['apiFinancialTransactionGet', 'apiFinancialTransactionIdDelete']);
    const categorySpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    transactionSpy.apiFinancialTransactionGet.and.returnValue(of(MOCK_ODATA_RESPONSE));
    categorySpy.apiTransactionCategoryGet.and.returnValue(of(MOCK_CATEGORY_ODATA));

    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: FinancialTransactionService, useValue: transactionSpy },
        { provide: TransactionCategoryService, useValue: categorySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    transactionService = TestBed.inject(FinancialTransactionService) as jasmine.SpyObj<FinancialTransactionService>;
    categoryService = TestBed.inject(TransactionCategoryService) as jasmine.SpyObj<TransactionCategoryService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    transactionService.apiFinancialTransactionGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    const page = (component as any).items();
    expect(page.currentPage).toBe(2);
    expect(page.items[0].id).toBe(MOCK_ITEMS[10].id);
    expect(transactionService.apiFinancialTransactionGet).not.toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    transactionService.apiFinancialTransactionGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    const page = (component as any).items();
    expect(page.currentPage).toBe(1);
    expect(page.items.length).toBe(20);
    expect(page.items[0].id).toBe(MOCK_ITEMS[0].id);
    expect(transactionService.apiFinancialTransactionGet).not.toHaveBeenCalled();
  });

  describe('getTypeLabel', () => {
    it('should return correct labels for each type', () => {
      expect((component as any).getTypeLabel(TransactionType.Debit)).toBe('Débito');
      expect((component as any).getTypeLabel(TransactionType.Credit)).toBe('Crédito');
      expect((component as any).getTypeLabel(TransactionType.Refund)).toBe('Reembolso');
      expect((component as any).getTypeLabel(TransactionType.Adjustment)).toBe('Ajuste');
      expect((component as any).getTypeLabel(TransactionType.Income)).toBe('Receita');
      expect((component as any).getTypeLabel(TransactionType.Expense)).toBe('Despesa');
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
      spyOn(window, 'confirm').and.returnValue(true);
      transactionService.apiFinancialTransactionIdDelete.and.returnValue(of(null as any));
      transactionService.apiFinancialTransactionGet.calls.reset();
    });

    it('should delete transaction and reload on confirmation', () => {
      (component as any).delete(MOCK_TRANSACTION);
      expect(transactionService.apiFinancialTransactionIdDelete).toHaveBeenCalledWith(MOCK_TRANSACTION.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(transactionService.apiFinancialTransactionGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_TRANSACTION);
      expect(transactionService.apiFinancialTransactionIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      transactionService.apiFinancialTransactionIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_TRANSACTION);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
