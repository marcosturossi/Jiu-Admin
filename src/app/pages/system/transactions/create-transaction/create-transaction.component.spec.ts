import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CreateTransactionComponent } from './create-transaction.component';
import { FinancialTransactionService } from '../../../../generated_services/api/financialTransaction.service';
import { NotificationService } from '../../../../services/notification.service';
import { TransactionType } from '../../../../generated_services/model/transactionType';
import { of, throwError } from 'rxjs';

describe('CreateTransactionComponent', () => {
  let fixture: ComponentFixture<CreateTransactionComponent>;
  let component: CreateTransactionComponent;
  let transactionSpy: jasmine.SpyObj<FinancialTransactionService>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  const CATEGORIES = [
    { id: 'c1', name: 'Mensalidade' },
    { id: 'c2', name: 'Taxa de Inscrição' },
  ];

  beforeEach(async () => {
    transactionSpy = jasmine.createSpyObj('FinancialTransactionService', ['apiFinancialTransactionPost']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [CreateTransactionComponent],
      providers: [
        provideHttpClient(),
        { provide: FinancialTransactionService, useValue: transactionSpy },
        { provide: NotificationService, useValue: notifySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTransactionComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preserves string enum values selected in the form', () => {
    transactionSpy.apiFinancialTransactionPost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({
      type: TransactionType.Credit,
      amount: 100,
      transactionDate: '2024-06-15',
    });
    (component as any).save();
    const args = transactionSpy.apiFinancialTransactionPost.calls.mostRecent().args[0]!;
    expect(typeof (args.type as any)).toBe('string');
    expect(args.type as any).toBe(TransactionType.Credit);
  });

  it('sends Income for Receita', () => {
    transactionSpy.apiFinancialTransactionPost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({ type: TransactionType.Income, amount: 50, transactionDate: '2024-06-15' });
    (component as any).save();
    const args = transactionSpy.apiFinancialTransactionPost.calls.mostRecent().args[0]!;
    expect(args.type as any).toBe(TransactionType.Income);
  });

  it('does not submit when form is invalid', () => {
    (component as any).form.patchValue({ amount: null });
    (component as any).save();
    expect(transactionSpy.apiFinancialTransactionPost).not.toHaveBeenCalled();
  });

  it('emits transactionCreated on success', () => {
    transactionSpy.apiFinancialTransactionPost.and.returnValue(of({} as any));
    const form = (component as any).form;
    form.patchValue({ amount: 100, transactionDate: '2024-06-15' });
    let emitted = false;
    component.transactionCreated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
  });

  it('shows error notification on failure', () => {
    transactionSpy.apiFinancialTransactionPost.and.returnValue(throwError(() => new Error()));
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
