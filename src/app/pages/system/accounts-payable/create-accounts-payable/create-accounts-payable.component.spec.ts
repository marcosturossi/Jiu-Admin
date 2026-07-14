import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CreateAccountsPayableComponent } from './create-accounts-payable.component';
import { AccountsPayableService } from '../../../../generated_services/api/accountsPayable.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateAccountsPayableComponent', () => {
  let fixture: ComponentFixture<CreateAccountsPayableComponent>;
  let component: CreateAccountsPayableComponent;
  let apSpy: jasmine.SpyObj<AccountsPayableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  const CATEGORIES = [
    { id: 'c1', name: 'Aluguel' },
    { id: 'c2', name: 'Material' },
  ];

  beforeEach(async () => {
    apSpy = jasmine.createSpyObj('AccountsPayableService', ['apiAccountsPayablePost']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateAccountsPayableComponent],
      providers: [
        provideHttpClient(),
        { provide: AccountsPayableService, useValue: apSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAccountsPayableComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when form is invalid', () => {
    (component as any).form.patchValue({ amount: null });
    (component as any).save();
    expect(apSpy.apiAccountsPayablePost).not.toHaveBeenCalled();
  });

  it('emits itemCreated on success', () => {
    apSpy.apiAccountsPayablePost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({ amount: 100, transactionDate: '2024-06-15' });
    let emitted = false;
    component.itemCreated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
  });

  it('shows error notification on failure', () => {
    apSpy.apiAccountsPayablePost.and.returnValue(throwError(() => new Error()));
    const form = (component as any).form;
    form.patchValue({ amount: 100, transactionDate: '2024-06-15' });
    (component as any).save();
    expect(notifySpy.showError).toHaveBeenCalled();
  });

  it('emits closeEvent when close() is called', () => {
    let closed = false;
    component.closeEvent.subscribe(() => (closed = true));
    (component as any).close();
    expect(closed).toBeTrue();
  });
});
