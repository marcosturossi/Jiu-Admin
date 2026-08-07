import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PaymentSettingsComponent } from './payment-settings.component';
import { TenantSettingsService } from '../../../generated_services/api/tenantSettings.service';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';

const MOCK_SETTINGS_NONE = { paymentGateway: null, hasCredentialsConfigured: false, webhookSecret: null, environment: null } as any;
const MOCK_SETTINGS_ASAAS = { paymentGateway: 'asaas', hasCredentialsConfigured: true, webhookSecret: '****abcd', environment: 'Production' } as any;

describe('PaymentSettingsComponent', () => {
  let component: PaymentSettingsComponent;
  let fixture: ComponentFixture<PaymentSettingsComponent>;
  let tenantSettingsService: jasmine.SpyObj<TenantSettingsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const tenantSettingsSpy = jasmine.createSpyObj('TenantSettingsService', ['apiSettingsGet', 'apiSettingsPatch', 'apiSettingsTestConnectionPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    tenantSettingsSpy.apiSettingsGet.and.returnValue(of(MOCK_SETTINGS_NONE));

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

  it('should default to "Nenhum" and not require an API key when no gateway is configured', () => {
    expect((component as any).form.value.paymentGateway).toBe('');
    expect((component as any).hasCredentialsConfigured()).toBeFalse();
    expect((component as any).form.get('asaasApiKey')?.valid).toBeTrue();
  });

  it('should populate the saved environment (Production) instead of always defaulting to Sandbox', () => {
    tenantSettingsService.apiSettingsGet.and.returnValue(of(MOCK_SETTINGS_ASAAS));
    const f2 = TestBed.createComponent(PaymentSettingsComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).form.value.asaasEnvironment).toBe('Production');
  });

  it('should default to Sandbox when no environment is saved yet', () => {
    expect((component as any).form.value.asaasEnvironment).toBe('Sandbox');
  });

  it('should require an API key once Asaas is selected', () => {
    (component as any).form.get('paymentGateway')?.setValue('asaas');
    const apiKeyControl = (component as any).form.get('asaasApiKey');
    apiKeyControl.markAsTouched();
    expect(apiKeyControl.valid).toBeFalse();
    apiKeyControl.setValue('$aact_123');
    expect(apiKeyControl.valid).toBeTrue();
  });

  it('should block save and show an error when the form is invalid', () => {
    (component as any).form.get('paymentGateway')?.setValue('asaas');
    (component as any).save();
    expect(ns.showError).toHaveBeenCalled();
    expect(tenantSettingsService.apiSettingsPatch).not.toHaveBeenCalled();
  });

  it('should send credentials as apiKey/environment (not the old enum fields) when saving with Asaas selected', () => {
    tenantSettingsService.apiSettingsPatch.and.returnValue(of(MOCK_SETTINGS_ASAAS));
    const form = (component as any).form;
    // .setValue() is a programmatic (model -> view) change and does not mark controls dirty on
    // its own — mirror what a real user interaction does so the dirty-gated fields are exercised.
    form.get('paymentGateway').setValue('asaas');
    form.get('paymentGateway').markAsDirty();
    form.get('asaasApiKey').setValue('$aact_123');
    form.get('asaasEnvironment').setValue('Production');
    form.get('asaasEnvironment').markAsDirty();

    (component as any).save();

    expect(tenantSettingsService.apiSettingsPatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        paymentGateway: 'asaas',
        credentials: { apiKey: '$aact_123', environment: 'Production' },
      })
    );
  });

  it('should leave paymentGateway/webhookSecret untouched (sent as null) when their controls were never edited', () => {
    tenantSettingsService.apiSettingsGet.and.returnValue(of(MOCK_SETTINGS_ASAAS));
    const f2 = TestBed.createComponent(PaymentSettingsComponent);
    f2.detectChanges();
    tenantSettingsService.apiSettingsPatch.and.returnValue(of(MOCK_SETTINGS_ASAAS));

    // Simulates re-entering the still-required API key (the only field a user MUST touch while
    // Asaas stays selected) without ever touching the paymentGateway/webhookSecret controls.
    (f2.componentInstance as any).form.get('asaasApiKey')?.setValue('$aact_123');
    (f2.componentInstance as any).save();

    const sentDto = tenantSettingsService.apiSettingsPatch.calls.mostRecent().args[0];
    expect(sentDto.paymentGateway).toBeNull();
    expect(sentDto.webhookSecret).toBeNull();
    // Environment was loaded as 'Production' (MOCK_SETTINGS_ASAAS) and never touched by the user,
    // so it's resent as-is — same "always resend the whole credentials bag" rule as apiKey.
    expect(sentDto.credentials).toEqual({ apiKey: '$aact_123', environment: 'Production' });
  });

  it('should send credentials as null when "Nenhum" is selected', () => {
    tenantSettingsService.apiSettingsPatch.and.returnValue(of(MOCK_SETTINGS_NONE));
    (component as any).form.get('paymentGateway')?.setValue('');

    (component as any).save();

    const sentDto = tenantSettingsService.apiSettingsPatch.calls.mostRecent().args[0];
    expect(sentDto.credentials).toBeNull();
  });

  it('should do nothing when testing the connection while "Nenhum" is selected', () => {
    (component as any).form.get('paymentGateway')?.setValue('');
    (component as any).testConnection();
    expect(tenantSettingsService.apiSettingsTestConnectionPost).not.toHaveBeenCalled();
  });

  it('should block testing and show an error when no API key is typed and none is saved', () => {
    (component as any).form.get('paymentGateway')?.setValue('asaas');
    (component as any).testConnection();
    expect(ns.showError).toHaveBeenCalled();
    expect(tenantSettingsService.apiSettingsTestConnectionPost).not.toHaveBeenCalled();
  });

  it('should test ad-hoc credentials when an API key is typed', () => {
    tenantSettingsService.apiSettingsTestConnectionPost.and.returnValue(of({ success: true, error: null } as any));
    (component as any).form.get('paymentGateway')?.setValue('asaas');
    (component as any).form.get('asaasApiKey')?.setValue('$aact_123');
    (component as any).form.get('asaasEnvironment')?.setValue('Production');

    (component as any).testConnection();

    expect(tenantSettingsService.apiSettingsTestConnectionPost).toHaveBeenCalledWith({
      paymentGateway: 'asaas',
      credentials: { apiKey: '$aact_123', environment: 'Production' },
    });
    expect((component as any).testResult()).toEqual({ success: true, error: null });
  });

  it('should fall back to testing the already-saved credentials when the API key field is left blank', () => {
    tenantSettingsService.apiSettingsGet.and.returnValue(of(MOCK_SETTINGS_ASAAS));
    const f2 = TestBed.createComponent(PaymentSettingsComponent);
    f2.detectChanges();
    tenantSettingsService.apiSettingsTestConnectionPost.and.returnValue(of({ success: true, error: null } as any));

    (f2.componentInstance as any).testConnection();

    expect(tenantSettingsService.apiSettingsTestConnectionPost).toHaveBeenCalledWith({
      paymentGateway: null,
      credentials: null,
    } as any);
  });

  it('should surface a failed connection result without treating it as an HTTP error', () => {
    tenantSettingsService.apiSettingsTestConnectionPost.and.returnValue(
      of({ success: false, error: 'Asaas API error 401: invalid api key' } as any)
    );
    (component as any).form.get('paymentGateway')?.setValue('asaas');
    (component as any).form.get('asaasApiKey')?.setValue('wrong-key');

    (component as any).testConnection();

    expect((component as any).testResult()).toEqual({ success: false, error: 'Asaas API error 401: invalid api key' });
    expect((component as any).isTesting()).toBeFalse();
  });

  it('should surface an HTTP-level test-connection failure as a failed result', () => {
    tenantSettingsService.apiSettingsTestConnectionPost.and.returnValue(throwError(() => new Error('network down')));
    (component as any).form.get('paymentGateway')?.setValue('asaas');
    (component as any).form.get('asaasApiKey')?.setValue('$aact_123');

    (component as any).testConnection();

    expect((component as any).testResult()?.success).toBeFalse();
    expect((component as any).isTesting()).toBeFalse();
  });

  it('should clear a stale test result once the form is edited again', () => {
    (component as any).testResult.set({ success: true, error: null });
    (component as any).form.get('webhookSecret')?.setValue('new-value');
    expect((component as any).testResult()).toBeNull();
  });

  it('should set loading to false on load error', () => {
    tenantSettingsService.apiSettingsGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(PaymentSettingsComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should expose the Asaas webhook URL', () => {
    expect((component as any).webhookUrl).toContain('/api/public/webhooks/asaas');
  });

  it('should copy the webhook URL to the clipboard and notify success', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    (component as any).copyWebhookUrl();
    await fixture.whenStable();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith((component as any).webhookUrl);
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should notify an error when copying the webhook URL fails', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('denied')));
    (component as any).copyWebhookUrl();
    await fixture.whenStable();
    expect(ns.showError).toHaveBeenCalled();
  });
});
