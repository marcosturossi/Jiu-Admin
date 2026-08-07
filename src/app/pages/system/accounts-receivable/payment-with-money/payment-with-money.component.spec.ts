import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PaymentWithMoneyComponent } from './payment-with-money.component';
import { AccountsReceivableService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('PaymentWithMoneyComponent', () => {
  let component: PaymentWithMoneyComponent;
  let fixture: ComponentFixture<PaymentWithMoneyComponent>;
  let arSpy: jasmine.SpyObj<AccountsReceivableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableIdConfirmPaymentMoneyPatch']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [PaymentWithMoneyComponent],
      providers: [
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentWithMoneyComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('item', { id: 'ar1', amount: 100 as any, dueDate: '2026-08-10' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirms payment with money on save', () => {
    arSpy.apiAccountsReceivableIdConfirmPaymentMoneyPatch.and.returnValue(of({} as any));
    let emitted = false;
    component.itemUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(arSpy.apiAccountsReceivableIdConfirmPaymentMoneyPatch)
      .toHaveBeenCalledWith('ar1', jasmine.objectContaining({ paidAmount: 100 }));
    expect(notifySpy.showSuccess).toHaveBeenCalled();
    expect(emitted).toBeTrue();
  });

  it('shows error notification on failure', () => {
    arSpy.apiAccountsReceivableIdConfirmPaymentMoneyPatch.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(notifySpy.showError).toHaveBeenCalled();
  });
});
