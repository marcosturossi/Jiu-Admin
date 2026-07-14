import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RefundAccountsReceivableComponent } from './refund-accounts-receivable.component';
import { AccountsReceivableService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('RefundAccountsReceivableComponent', () => {
  let component: RefundAccountsReceivableComponent;
  let fixture: ComponentFixture<RefundAccountsReceivableComponent>;
  let arSpy: jasmine.SpyObj<AccountsReceivableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableIdRefundPatch']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [RefundAccountsReceivableComponent],
      providers: [
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefundAccountsReceivableComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('item', { id: 'ar1' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('refunds and emits itemUpdated on success', () => {
    arSpy.apiAccountsReceivableIdRefundPatch.and.returnValue(of({} as any));
    let emitted = false;
    component['itemUpdated'].subscribe(() => (emitted = true));
    (component as any).refund();
    expect(arSpy.apiAccountsReceivableIdRefundPatch).toHaveBeenCalledWith('ar1');
    expect(notifySpy.showSuccess).toHaveBeenCalled();
    expect(emitted).toBeTrue();
  });

  it('shows error notification on failure', () => {
    arSpy.apiAccountsReceivableIdRefundPatch.and.returnValue(throwError(() => new Error('boom')));
    (component as any).refund();
    expect(notifySpy.showError).toHaveBeenCalled();
  });
});
