import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GenerateChargeComponent } from './generate-charge.component';
import { AccountsReceivableService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('GenerateChargeComponent', () => {
  let component: GenerateChargeComponent;
  let fixture: ComponentFixture<GenerateChargeComponent>;
  let arSpy: jasmine.SpyObj<AccountsReceivableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableChargePost']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [GenerateChargeComponent],
      providers: [
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateChargeComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('item', { id: 'ar1', personName: 'Aluno Teste', amount: 100 as any });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('generates a charge and stores the result on success', () => {
    const result = { chargeId: 'ext-1', pixQrCodeBase64: 'abc', pixCopyPaste: 'copy-paste', invoiceUrl: 'https://x', status: 'PENDING' };
    arSpy.apiAccountsReceivableChargePost.and.returnValue(of(result as any));
    let emitted = false;
    component.itemUpdated.subscribe(() => (emitted = true));

    (component as any).generate();

    expect(arSpy.apiAccountsReceivableChargePost).toHaveBeenCalledWith(
      jasmine.objectContaining({ financialTransactionId: 'ar1', billingType: 'PIX' }));
    expect(notifySpy.showSuccess).toHaveBeenCalled();
    expect(emitted).toBeTrue();
    expect((component as any).result()).toEqual(result);
  });

  it('shows error notification on failure', () => {
    arSpy.apiAccountsReceivableChargePost.and.returnValue(throwError(() => new Error('boom')));
    (component as any).generate();
    expect(notifySpy.showError).toHaveBeenCalled();
    expect((component as any).result()).toBeNull();
  });
});
