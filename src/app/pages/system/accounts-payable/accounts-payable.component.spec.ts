import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AccountsPayableComponent } from './accounts-payable.component';

registerLocaleData(localePt, 'pt-BR');
import { AccountsPayableService } from '../../../generated_services/api/accountsPayable.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowAccountsPayableDTO, ShowTransactionCategoryDTO } from '../../../generated_services';

const MOCK_ITEM: ShowAccountsPayableDTO = { id: 'p1', description: 'Aluguel', amount: 500 as any, transactionCategoryId: 'cat1' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_ITEM, id: `ap${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});
const MOCK_CATEGORIES: ShowTransactionCategoryDTO[] = [{ id: 'cat1', name: 'Aluguel' }];
const MOCK_CATEGORY_RESPONSE = { items: MOCK_CATEGORIES, totalCount: 1, totalPages: 1 };

describe('AccountsPayableComponent', () => {
  let component: AccountsPayableComponent;
  let fixture: ComponentFixture<AccountsPayableComponent>;
  let accountsPayableService: jasmine.SpyObj<AccountsPayableService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const apSpy = jasmine.createSpyObj('AccountsPayableService', ['apiAccountsPayableGet', 'apiAccountsPayableIdDelete']);
    const categorySpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    // page is at arg index 7 (0-based), pageSize at 8
    apSpy.apiAccountsPayableGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[7] ?? 1), Number(args[8] ?? 10))));
    categorySpy.apiTransactionCategoryGet.and.returnValue(of(MOCK_CATEGORY_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [AccountsPayableComponent],
      providers: [
        provideHttpClient(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: AccountsPayableService, useValue: apSpy },
        { provide: TransactionCategoryService, useValue: categorySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsPayableComponent);
    component = fixture.componentInstance;
    accountsPayableService = TestBed.inject(AccountsPayableService) as jasmine.SpyObj<AccountsPayableService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update page and reload on onPageChange', () => {
    accountsPayableService.apiAccountsPayableGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(accountsPayableService.apiAccountsPayableGet).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  describe('getCategoryName', () => {
    it('should return category name from loaded categories', () => {
      expect((component as any).getCategoryName('cat1')).toBe('Aluguel');
    });

    it('should return "—" when categoryId is null', () => {
      expect((component as any).getCategoryName(null)).toBe('—');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      accountsPayableService.apiAccountsPayableIdDelete.and.returnValue(of(null as any));
      accountsPayableService.apiAccountsPayableGet.calls.reset();
    });

    it('should delete item and reload on confirmation', async () => {
      await (component as any).delete(MOCK_ITEM);
      expect(accountsPayableService.apiAccountsPayableIdDelete).toHaveBeenCalledWith(MOCK_ITEM.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(accountsPayableService.apiAccountsPayableGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_ITEM);
      expect(accountsPayableService.apiAccountsPayableIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      accountsPayableService.apiAccountsPayableIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_ITEM);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
