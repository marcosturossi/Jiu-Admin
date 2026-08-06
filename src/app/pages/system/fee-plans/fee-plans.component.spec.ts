import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { FeePlansComponent } from './fee-plans.component';

registerLocaleData(localePt, 'pt-BR');
import { FeePlanService, ShowFeePlanDTO as ShowFeePlanDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';

const MOCK_FEE_PLAN: ShowFeePlanDTO = { id: 'fp1', name: 'Plano Mensal', price: 150, monthDuration: 1, isActive: true };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_FEE_PLAN, id: `fp${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('FeePlansComponent', () => {
  let component: FeePlansComponent;
  let fixture: ComponentFixture<FeePlansComponent>;
  let feePlanService: jasmine.SpyObj<FeePlanService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const feePlanSpy = jasmine.createSpyObj('FeePlanService', ['apiFeePlanGet', 'apiFeePlanIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    feePlanSpy.apiFeePlanGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[5] ?? 1), Number(args[6] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [FeePlansComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: FeePlanService, useValue: feePlanSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeePlansComponent);
    component = fixture.componentInstance;
    feePlanService = TestBed.inject(FeePlanService) as jasmine.SpyObj<FeePlanService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((feePlanService.apiFeePlanGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((feePlanService.apiFeePlanGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      feePlanService.apiFeePlanIdDelete.and.returnValue(of(null as any));
      feePlanService.apiFeePlanGet.calls.reset();
    });

    it('should delete fee plan and reload on confirmation', async () => {
      await (component as any).delete(MOCK_FEE_PLAN);
      expect(feePlanService.apiFeePlanIdDelete).toHaveBeenCalledWith(MOCK_FEE_PLAN.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_FEE_PLAN);
      expect(feePlanService.apiFeePlanIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      feePlanService.apiFeePlanIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_FEE_PLAN);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
