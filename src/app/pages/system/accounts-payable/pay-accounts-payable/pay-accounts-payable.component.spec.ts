import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PayAccountsPayableComponent } from './pay-accounts-payable.component';
import { AccountsPayableService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('PayAccountsPayableComponent', () => {
  let component: PayAccountsPayableComponent;
  let fixture: ComponentFixture<PayAccountsPayableComponent>;
  let apSpy: jasmine.SpyObj<AccountsPayableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    apSpy = jasmine.createSpyObj('AccountsPayableService', ['apiAccountsPayableIdPayPatch']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [PayAccountsPayableComponent],
      providers: [
        { provide: AccountsPayableService, useValue: apSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PayAccountsPayableComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('item', { id: 'p1', amount: 500 as any });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pays and emits itemPaid on success', () => {
    apSpy.apiAccountsPayableIdPayPatch.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({ paidAmount: 500, paidAt: '2024-06-15' });
    let emitted = false;
    component.itemPaid.subscribe(() => (emitted = true));
    (component as any).save();
    expect(apSpy.apiAccountsPayableIdPayPatch).toHaveBeenCalledWith('p1', jasmine.objectContaining({ paidAmount: 500 }));
    expect(notifySpy.showSuccess).toHaveBeenCalled();
    expect(emitted).toBeTrue();
  });

  it('does not submit when form is invalid', () => {
    const form = (component as any).form;
    form.patchValue({ paidAmount: null });
    (component as any).save();
    expect(apSpy.apiAccountsPayableIdPayPatch).not.toHaveBeenCalled();
  });

  it('shows error notification on failure', () => {
    apSpy.apiAccountsPayableIdPayPatch.and.returnValue(throwError(() => new Error()));
    const form = (component as any).form;
    form.patchValue({ paidAmount: 500, paidAt: '2024-06-15' });
    (component as any).save();
    expect(notifySpy.showError).toHaveBeenCalled();
  });
});
