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
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
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
  let categoryService: jasmine.SpyObj<TransactionCategoryService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableGet', 'apiAccountsReceivableChargeIdDelete']);
    const categorySpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    // page is at arg index 8 (0-based), pageSize at 9
    arSpy.apiAccountsReceivableGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[8] ?? 1), Number(args[9] ?? 10))));
    categorySpy.apiTransactionCategoryGet.and.returnValue(of(MOCK_CATEGORY_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [AccountsReceivableComponent],
      providers: [
        provideHttpClient(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: TransactionCategoryService, useValue: categorySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsReceivableComponent);
    component = fixture.componentInstance;
    accountsReceivableService = TestBed.inject(AccountsReceivableService) as jasmine.SpyObj<AccountsReceivableService>;
    categoryService = TestBed.inject(TransactionCategoryService) as jasmine.SpyObj<TransactionCategoryService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
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
      spyOn(window, 'confirm').and.returnValue(true);
      accountsReceivableService.apiAccountsReceivableChargeIdDelete.and.returnValue(of(null as any));
      accountsReceivableService.apiAccountsReceivableGet.calls.reset();
    });

    it('should delete item and reload on confirmation', () => {
      (component as any).delete(MOCK_ITEM);
      expect(accountsReceivableService.apiAccountsReceivableChargeIdDelete).toHaveBeenCalledWith(MOCK_ITEM.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(accountsReceivableService.apiAccountsReceivableGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_ITEM);
      expect(accountsReceivableService.apiAccountsReceivableChargeIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      accountsReceivableService.apiAccountsReceivableChargeIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_ITEM);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
