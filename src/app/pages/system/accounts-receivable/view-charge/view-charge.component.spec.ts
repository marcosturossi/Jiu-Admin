import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ViewChargeComponent } from './view-charge.component';
import { AccountsReceivableService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('ViewChargeComponent', () => {
  let component: ViewChargeComponent;
  let fixture: ComponentFixture<ViewChargeComponent>;
  let arSpy: jasmine.SpyObj<AccountsReceivableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableIdChargeStatusGet']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [ViewChargeComponent],
      providers: [
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewChargeComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('item', {
      id: 'ar1',
      externalChargeId: 'ext-1',
      pixCopyPaste: 'copy-paste-code',
      invoiceUrl: 'https://pay.example/x',
      paymentInformation: { billingType: 'PIX' },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels the billing type in Portuguese', () => {
    expect(component['getBillingTypeLabel']()).toBe('PIX');
  });

  it('checks charge status and stores the result', () => {
    const status = { chargeId: 'ext-1', status: 'CONFIRMED', confirmedValue: 100, confirmedAt: '2026-08-01T00:00:00Z' };
    arSpy.apiAccountsReceivableIdChargeStatusGet.and.returnValue(of(status as any));

    (component as any).checkStatus();

    expect(arSpy.apiAccountsReceivableIdChargeStatusGet).toHaveBeenCalledWith('ar1');
    expect((component as any).chargeStatus()).toEqual(status);
  });

  it('shows error notification when status check fails', () => {
    arSpy.apiAccountsReceivableIdChargeStatusGet.and.returnValue(throwError(() => new Error('boom')));
    (component as any).checkStatus();
    expect(notifySpy.showError).toHaveBeenCalled();
  });
});
