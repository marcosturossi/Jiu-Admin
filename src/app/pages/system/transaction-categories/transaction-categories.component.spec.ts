import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransactionCategoriesComponent } from './transaction-categories.component';
import { TransactionCategoryService, PaginationTransactionCategoryDTO, ShowTransactionCategoryDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

const MOCK_CATEGORY: ShowTransactionCategoryDTO = { id: 'cat1', name: 'Mensalidades', isActive: true };
const MOCK_PAGINATION: PaginationTransactionCategoryDTO = { items: [MOCK_CATEGORY], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1 };

describe('TransactionCategoriesComponent', () => {
  let component: TransactionCategoriesComponent;
  let fixture: ComponentFixture<TransactionCategoriesComponent>;
  let categoryService: jasmine.SpyObj<TransactionCategoryService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const categorySpy = jasmine.createSpyObj('TransactionCategoryService', ['apiTransactionCategoryGet', 'apiTransactionCategoryIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    categorySpy.apiTransactionCategoryGet.and.returnValue(of(MOCK_PAGINATION));

    await TestBed.configureTestingModule({
      imports: [TransactionCategoriesComponent],
      providers: [
        { provide: TransactionCategoryService, useValue: categorySpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionCategoriesComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(TransactionCategoryService) as jasmine.SpyObj<TransactionCategoryService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Categorias de Transação'); });

  it('should load categories on init', () => {
    expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGINATION);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    categoryService.apiTransactionCategoryGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected category', () => {
    (component as any).openEdit(MOCK_CATEGORY);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_CATEGORY);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    categoryService.apiTransactionCategoryGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    categoryService.apiTransactionCategoryGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    categoryService.apiTransactionCategoryGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    categoryService.apiTransactionCategoryGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      categoryService.apiTransactionCategoryIdDelete.and.returnValue(of(null as any));
      categoryService.apiTransactionCategoryGet.calls.reset();
    });

    it('should delete category and reload on confirmation', () => {
      (component as any).delete(MOCK_CATEGORY);
      expect(categoryService.apiTransactionCategoryIdDelete).toHaveBeenCalledWith(MOCK_CATEGORY.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(categoryService.apiTransactionCategoryGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_CATEGORY);
      expect(categoryService.apiTransactionCategoryIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      categoryService.apiTransactionCategoryIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_CATEGORY);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
