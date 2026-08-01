import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransactionCategoriesComponent } from './transaction-categories.component';
import { TransactionCategoryService, ShowTransactionCategoryDTO as ShowTransactionCategoryDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';

const MOCK_CATEGORY: ShowTransactionCategoryDTO = { id: 'cat1', name: 'Mensalidades', isActive: true };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_CATEGORY, id: `tc${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('TransactionCategoriesComponent', () => {
  let component: TransactionCategoriesComponent;
  let fixture: ComponentFixture<TransactionCategoriesComponent>;
  let categoryService: jasmine.SpyObj<TransactionCategoryService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const categorySpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryGet', 'apiTransactionCategoryIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    categorySpy.apiTransactionCategoryGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[2] ?? 1), Number(args[3] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [TransactionCategoriesComponent],
      providers: [
        { provide: TransactionCategoryService, useValue: categorySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionCategoriesComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(TransactionCategoryService) as jasmine.SpyObj<TransactionCategoryService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    categoryService.apiTransactionCategoryGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((categoryService.apiTransactionCategoryGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    categoryService.apiTransactionCategoryGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((categoryService.apiTransactionCategoryGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      categoryService.apiTransactionCategoryIdDelete.and.returnValue(of(null as any));
      categoryService.apiTransactionCategoryGet.calls.reset();
    });

    it('should delete category and reload on confirmation', async () => {
      await (component as any).delete(MOCK_CATEGORY);
      expect(categoryService.apiTransactionCategoryIdDelete).toHaveBeenCalledWith(MOCK_CATEGORY.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_CATEGORY);
      expect(categoryService.apiTransactionCategoryIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      categoryService.apiTransactionCategoryIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_CATEGORY);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
