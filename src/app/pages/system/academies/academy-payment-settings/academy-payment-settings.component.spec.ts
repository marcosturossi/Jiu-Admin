import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AcademyPaymentSettingsComponent } from './academy-payment-settings.component';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_ACADEMY = { id: 'a1', name: 'Academia Teste' } as any;
const MOCK_SETTINGS_EMPTY = { academyId: 'a1', asaasWalletId: null, splitType: null, splitPercentualValue: null, splitFixedValue: null } as any;
const MOCK_SETTINGS_PERCENTAGE = { academyId: 'a1', asaasWalletId: 'wallet-123', splitType: 'Percentage', splitPercentualValue: 10, splitFixedValue: null } as any;

describe('AcademyPaymentSettingsComponent', () => {
  let component: AcademyPaymentSettingsComponent;
  let fixture: ComponentFixture<AcademyPaymentSettingsComponent>;
  let academyService: jasmine.SpyObj<AcademyService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const academySpy = jasmine.createSpyObj('AcademyService', ['apiAdminAcademiesIdPaymentSettingsGet', 'apiAdminAcademiesIdPaymentSettingsPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    academySpy.apiAdminAcademiesIdPaymentSettingsGet.and.returnValue(of(MOCK_SETTINGS_EMPTY));

    await TestBed.configureTestingModule({
      imports: [AcademyPaymentSettingsComponent],
      providers: [
        { provide: AcademyService, useValue: academySpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademyPaymentSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('academy', MOCK_ACADEMY);
    academyService = TestBed.inject(AcademyService) as jasmine.SpyObj<AcademyService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load the academy payment settings on init', () => {
    expect(academyService.apiAdminAcademiesIdPaymentSettingsGet).toHaveBeenCalledWith('a1');
  });

  it('should default splitType to Percentage when nothing is configured yet', () => {
    expect((component as any).form.value.splitType).toBe('Percentage');
    expect((component as any).isPercentageSelected()).toBeTrue();
  });

  it('should populate saved settings', () => {
    academyService.apiAdminAcademiesIdPaymentSettingsGet.and.returnValue(of(MOCK_SETTINGS_PERCENTAGE));
    const f2 = TestBed.createComponent(AcademyPaymentSettingsComponent);
    f2.componentRef.setInput('academy', MOCK_ACADEMY);
    f2.detectChanges();
    expect((f2.componentInstance as any).form.value.asaasWalletId).toBe('wallet-123');
    expect((f2.componentInstance as any).form.value.splitPercentualValue).toBe(10);
  });

  it('should require asaasWalletId', () => {
    const control = (component as any).form.get('asaasWalletId');
    control.markAsTouched();
    expect(control.valid).toBeFalse();
    control.setValue('wallet-123');
    expect(control.valid).toBeTrue();
  });

  it('should require splitPercentualValue when Percentage is selected', () => {
    const control = (component as any).form.get('splitPercentualValue');
    control.markAsTouched();
    expect(control.valid).toBeFalse();
    control.setValue(10);
    expect(control.valid).toBeTrue();
  });

  it('should switch validation to splitFixedValue when FixedValue is selected', () => {
    (component as any).form.get('splitType')?.setValue('FixedValue');
    expect((component as any).isPercentageSelected()).toBeFalse();
    const percentualControl = (component as any).form.get('splitPercentualValue');
    const fixedControl = (component as any).form.get('splitFixedValue');
    expect(percentualControl.valid).toBeTrue();
    fixedControl.markAsTouched();
    expect(fixedControl.valid).toBeFalse();
  });

  it('should block save and show an error when the form is invalid', () => {
    (component as any).form.get('splitPercentualValue')?.setValue(null);
    (component as any).save();
    expect(ns.showError).toHaveBeenCalled();
    expect(academyService.apiAdminAcademiesIdPaymentSettingsPut).not.toHaveBeenCalled();
  });

  it('should save percentage split settings and emit closeEvent', () => {
    academyService.apiAdminAcademiesIdPaymentSettingsPut.and.returnValue(of(MOCK_SETTINGS_PERCENTAGE));
    spyOn(component.closeEvent, 'emit');
    (component as any).form.patchValue({ asaasWalletId: 'wallet-123', splitType: 'Percentage', splitPercentualValue: 10 });

    (component as any).save();

    expect(academyService.apiAdminAcademiesIdPaymentSettingsPut).toHaveBeenCalledWith('a1', {
      asaasWalletId: 'wallet-123',
      splitType: 'Percentage',
      splitPercentualValue: 10,
      splitFixedValue: null,
      defaultBillingType: null,
    });
    expect(component.closeEvent.emit).toHaveBeenCalled();
  });

  it('should accept 0 as a valid split value', () => {
    const control = (component as any).form.get('splitPercentualValue');
    control.setValue(0);
    control.markAsTouched();
    expect(control.valid).toBeTrue();
  });

  it('should reject a negative split value', () => {
    const control = (component as any).form.get('splitPercentualValue');
    control.setValue(-1);
    control.markAsTouched();
    expect(control.valid).toBeFalse();
  });

  it('should populate defaultBillingType from saved settings and send it on save', () => {
    academyService.apiAdminAcademiesIdPaymentSettingsGet.and.returnValue(of({ ...MOCK_SETTINGS_PERCENTAGE, defaultBillingType: 'PIX' }));
    const f2 = TestBed.createComponent(AcademyPaymentSettingsComponent);
    f2.componentRef.setInput('academy', MOCK_ACADEMY);
    f2.detectChanges();
    expect((f2.componentInstance as any).form.value.defaultBillingType).toBe('PIX');

    academyService.apiAdminAcademiesIdPaymentSettingsPut.and.returnValue(of({} as any));
    (f2.componentInstance as any).save();
    expect(academyService.apiAdminAcademiesIdPaymentSettingsPut).toHaveBeenCalledWith('a1', jasmine.objectContaining({ defaultBillingType: 'PIX' }));
  });

  it('should save fixed-value split settings with the percentage field nulled out', () => {
    academyService.apiAdminAcademiesIdPaymentSettingsPut.and.returnValue(of({} as any));
    (component as any).form.patchValue({ asaasWalletId: 'wallet-123', splitType: 'FixedValue', splitFixedValue: 25 });

    (component as any).save();

    expect(academyService.apiAdminAcademiesIdPaymentSettingsPut).toHaveBeenCalledWith('a1', jasmine.objectContaining({
      splitType: 'FixedValue',
      splitPercentualValue: null,
      splitFixedValue: 25,
    }));
  });

  it('should show an error and stop saving when the request fails', () => {
    academyService.apiAdminAcademiesIdPaymentSettingsPut.and.returnValue(throwError(() => new Error('fail')));
    (component as any).form.patchValue({ asaasWalletId: 'wallet-123', splitPercentualValue: 10 });

    (component as any).save();

    expect(ns.showError).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should emit closeEvent when cancel is clicked', () => {
    spyOn(component.closeEvent, 'emit');
    (component as any).close();
    expect(component.closeEvent.emit).toHaveBeenCalled();
  });

  it('should notify an error when loading settings fails', () => {
    academyService.apiAdminAcademiesIdPaymentSettingsGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(AcademyPaymentSettingsComponent);
    f2.componentRef.setInput('academy', MOCK_ACADEMY);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });
});
