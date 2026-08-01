import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CreateAccountsReceivableComponent } from './create-accounts-receivable.component';
import { AccountsReceivableService } from '../../../../generated_services/api/accountsReceivable.service';
import { NotificationService } from '../../../../services/notification.service';
import { TransactionType } from '../../../../generated_services/model/transactionType';
import { of, throwError } from 'rxjs';

describe('CreateAccountsReceivableComponent', () => {
  let fixture: ComponentFixture<CreateAccountsReceivableComponent>;
  let component: CreateAccountsReceivableComponent;
  let arSpy: jasmine.SpyObj<AccountsReceivableService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  const CATEGORIES = [
    { id: 'c1', name: 'Mensalidade' },
    { id: 'c2', name: 'Taxa de Inscrição' },
  ];

  beforeEach(async () => {
    arSpy = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivablePost']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateAccountsReceivableComponent],
      providers: [
        provideHttpClient(),
        { provide: AccountsReceivableService, useValue: arSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAccountsReceivableComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends Income for Receita', () => {
    arSpy.apiAccountsReceivablePost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({ type: TransactionType.Income, personId: 'stu1', amount: 50, transactionDate: '2024-06-15' });
    (component as any).save();
    const args = arSpy.apiAccountsReceivablePost.calls.mostRecent().args[0]!;
    expect(args.type as any).toBe(TransactionType.Income);
  });

  it('does not submit when form is invalid', () => {
    (component as any).form.patchValue({ amount: null });
    (component as any).save();
    expect(arSpy.apiAccountsReceivablePost).not.toHaveBeenCalled();
  });

  it('emits itemCreated on success', () => {
    arSpy.apiAccountsReceivablePost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({ personId: 'stu1', amount: 100, transactionDate: '2024-06-15' });
    let emitted = false;
    component.itemCreated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
  });

  it('shows error notification on failure', () => {
    arSpy.apiAccountsReceivablePost.and.returnValue(throwError(() => new Error()));
    const form = (component as any).form;
    form.patchValue({ personId: 'stu1', amount: 100, transactionDate: '2024-06-15' });
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
