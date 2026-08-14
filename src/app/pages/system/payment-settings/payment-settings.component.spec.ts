import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PaymentSettingsComponent } from './payment-settings.component';
import { TenantSettingsService } from '../../../generated_services/api/tenantSettings.service';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';

const MOCK_SETTINGS_NONE = { defaultBillingType: null } as any;
const MOCK_SETTINGS_PIX = { defaultBillingType: 'PIX' } as any;
const MOCK_HISTORY_EMPTY = { items: [], totalCount: 0, totalPages: 1 } as any;
const MOCK_HISTORY = {
  items: [
    { id: 'e1', entityName: 'TenantSettings', entityId: 't1', action: 'Update', changedByUserId: 'u1', changedAt: '2026-08-14T10:00:00Z', oldValuesJson: '{"DefaultBillingType":null}', newValuesJson: '{"DefaultBillingType":"PIX"}' },
  ],
  totalCount: 1,
  totalPages: 1,
} as any;

describe('PaymentSettingsComponent', () => {
  let component: PaymentSettingsComponent;
  let fixture: ComponentFixture<PaymentSettingsComponent>;
  let tenantSettingsService: jasmine.SpyObj<TenantSettingsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const tenantSettingsSpy = jasmine.createSpyObj('TenantSettingsService', ['apiSettingsGet', 'apiSettingsPatch', 'apiSettingsAuditHistoryGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    tenantSettingsSpy.apiSettingsGet.and.returnValue(of(MOCK_SETTINGS_NONE));
    tenantSettingsSpy.apiSettingsAuditHistoryGet.and.returnValue(of(MOCK_HISTORY_EMPTY));

    await TestBed.configureTestingModule({
      imports: [PaymentSettingsComponent],
      providers: [
        { provide: TenantSettingsService, useValue: tenantSettingsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSettingsComponent);
    component = fixture.componentInstance;
    tenantSettingsService = TestBed.inject(TenantSettingsService) as jasmine.SpyObj<TenantSettingsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should default to the empty option when no default billing type is saved', () => {
    expect((component as any).form.value.defaultBillingType).toBe('');
  });

  it('should populate the saved default billing type', () => {
    tenantSettingsService.apiSettingsGet.and.returnValue(of(MOCK_SETTINGS_PIX));
    const f2 = TestBed.createComponent(PaymentSettingsComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).form.value.defaultBillingType).toBe('PIX');
  });

  it('should save the selected default billing type', () => {
    tenantSettingsService.apiSettingsPatch.and.returnValue(of(MOCK_SETTINGS_PIX));
    (component as any).form.get('defaultBillingType')?.setValue('PIX');

    (component as any).save();

    expect(tenantSettingsService.apiSettingsPatch).toHaveBeenCalledWith({ defaultBillingType: 'PIX' });
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should send null when the empty option is selected', () => {
    tenantSettingsService.apiSettingsPatch.and.returnValue(of(MOCK_SETTINGS_NONE));
    (component as any).form.get('defaultBillingType')?.setValue('');

    (component as any).save();

    expect(tenantSettingsService.apiSettingsPatch).toHaveBeenCalledWith({ defaultBillingType: null });
  });

  it('should show an error and stop saving when the request fails', () => {
    tenantSettingsService.apiSettingsPatch.and.returnValue(throwError(() => new Error('fail')));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should set loading to false and notify on load error', () => {
    tenantSettingsService.apiSettingsGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(PaymentSettingsComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should load audit history on init', () => {
    expect(tenantSettingsService.apiSettingsAuditHistoryGet).toHaveBeenCalledWith(1, 10);
  });

  it('should reload history when the page changes', () => {
    tenantSettingsService.apiSettingsAuditHistoryGet.and.returnValue(of(MOCK_HISTORY));
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(tenantSettingsService.apiSettingsAuditHistoryGet).toHaveBeenCalledWith(2, 10);
  });

  it('should reset to page 1 when the page size changes', () => {
    (component as any).currentPage.set(3);
    tenantSettingsService.apiSettingsAuditHistoryGet.and.returnValue(of(MOCK_HISTORY));
    (component as any).onPageSizeChange(25);
    expect((component as any).currentPage()).toBe(1);
    expect((component as any).pageSize()).toBe(25);
    expect(tenantSettingsService.apiSettingsAuditHistoryGet).toHaveBeenCalledWith(1, 25);
  });

  it('should toggle an entry expanded/collapsed', () => {
    expect((component as any).expandedEntryId()).toBeNull();
    (component as any).toggleExpanded('e1');
    expect((component as any).expandedEntryId()).toBe('e1');
    (component as any).toggleExpanded('e1');
    expect((component as any).expandedEntryId()).toBeNull();
  });

  it('should notify an error when history fails to load', () => {
    tenantSettingsService.apiSettingsAuditHistoryGet.and.returnValue(throwError(() => new Error('fail')));
    (component as any).loadHistory();
    expect((component as any).isLoadingHistory()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });
});
