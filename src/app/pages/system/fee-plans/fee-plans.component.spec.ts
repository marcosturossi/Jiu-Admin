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
const MOCK_ODATA_RESPONSE = { '@odata.count': 1, value: [MOCK_FEE_PLAN] };
const MOCK_PAGE = { items: [MOCK_FEE_PLAN], totalCount: 1, totalPages: 1 };

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
    feePlanSpy.apiFeePlanGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

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

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Planos de Mensalidade'); });

  it('should load fee plans on init', () => {
    expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGE);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    feePlanService.apiFeePlanGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected fee plan', () => {
    (component as any).openEdit(MOCK_FEE_PLAN);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_FEE_PLAN);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    feePlanService.apiFeePlanGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(feePlanService.apiFeePlanGet).toHaveBeenCalled();
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
