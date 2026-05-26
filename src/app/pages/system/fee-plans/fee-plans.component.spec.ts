import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { FeePlansComponent } from './fee-plans.component';

registerLocaleData(localePt, 'pt-BR');
import { FeePlanService, CarlonGracieBackendFinancesApplicationDTOsShowFeePlanDTO as ShowFeePlanDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

const MOCK_FEE_PLAN: ShowFeePlanDTO = { id: 'fp1', name: 'Plano Mensal', price: 150, monthDuration: 1, isActive: true };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_FEE_PLAN, id: `fp${i + 1}` }));
const buildResponse = (top = 20, skip = 0) => ({
  '@odata.count': MOCK_ITEMS.length,
  value: MOCK_ITEMS.slice(skip, skip + top),
});

describe('FeePlansComponent', () => {
  let component: FeePlansComponent;
  let fixture: ComponentFixture<FeePlansComponent>;
  let feePlanService: jasmine.SpyObj<FeePlanService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const feePlanSpy = jasmine.createSpyObj('FeePlanService', ['apiFeePlanGet', 'apiFeePlanIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    feePlanSpy.apiFeePlanGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[2] ?? 20), Number(args[3] ?? 0))));

    await TestBed.configureTestingModule({
      imports: [FeePlansComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: FeePlanService, useValue: feePlanSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeePlansComponent);
    component = fixture.componentInstance;
    feePlanService = TestBed.inject(FeePlanService) as jasmine.SpyObj<FeePlanService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((feePlanService.apiFeePlanGet as any)).toHaveBeenCalledWith(undefined, undefined, '10', '10', 'true', undefined, 'response');
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((feePlanService.apiFeePlanGet as any)).toHaveBeenCalledWith(undefined, undefined, '20', '0', 'true', undefined, 'response');
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      feePlanService.apiFeePlanIdDelete.and.returnValue(of(null as any));
      feePlanService.apiFeePlanGet.calls.reset();
    });

    it('should delete fee plan and reload on confirmation', () => {
      (component as any).delete(MOCK_FEE_PLAN);
      expect(feePlanService.apiFeePlanIdDelete).toHaveBeenCalledWith(MOCK_FEE_PLAN.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_FEE_PLAN);
      expect(feePlanService.apiFeePlanIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      feePlanService.apiFeePlanIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_FEE_PLAN);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
