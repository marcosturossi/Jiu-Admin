import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FinancialSummaryComponent } from './financial-summary.component';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';
import { TransactionType } from '../../../generated_services/model/transactionType';

const MOCK_TRANSACTIONS = {
  value: [
    { id: '1', type: TransactionType.Income, amount: 1000, transactionDate: new Date().toISOString() },
    { id: '2', type: TransactionType.Income, amount: 500, transactionDate: new Date().toISOString() },
    { id: '3', type: TransactionType.Expense, amount: 200, transactionDate: new Date().toISOString() },
  ],
  '@odata.count': 3,
} as any;

const MOCK_OVERDUE = [
  { id: 'f1', amount: 150, dueDate: '2024-01-01' },
  { id: 'f2', amount: 200, dueDate: '2024-02-01' },
] as any[];

describe('FinancialSummaryComponent', () => {
  let component: FinancialSummaryComponent;
  let fixture: ComponentFixture<FinancialSummaryComponent>;
  let transactionSvc: jasmine.SpyObj<FinancialTransactionService>;
  let monthlyFeeSvc: jasmine.SpyObj<MonthlyFeeService>;

  beforeEach(async () => {
    transactionSvc = jasmine.createSpyObj('FinancialTransactionService', ['apiFinancialTransactionGet']);
    monthlyFeeSvc = jasmine.createSpyObj('MonthlyFeeService', ['apiMonthlyFeeOverdueGet']);
    transactionSvc.apiFinancialTransactionGet.and.returnValue(of(MOCK_TRANSACTIONS));
    monthlyFeeSvc.apiMonthlyFeeOverdueGet.and.returnValue(of(MOCK_OVERDUE) as any);

    await TestBed.configureTestingModule({
      imports: [FinancialSummaryComponent],
      providers: [
        { provide: FinancialTransactionService, useValue: transactionSvc },
        { provide: MonthlyFeeService, useValue: monthlyFeeSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should compute totalIncome from income transactions', () => {
    expect((component as any).totalIncome()).toBe(1500);
  });

  it('should compute totalExpenses from expense transactions', () => {
    expect((component as any).totalExpenses()).toBe(200);
  });

  it('should compute balance as income minus expenses', () => {
    expect((component as any).balance()).toBe(1300);
  });

  it('should set overdueFeeCount from overdue fees array length', () => {
    expect((component as any).overdueFeeCount()).toBe(2);
  });

  it('should set pendingFeeTotal as sum of overdue fee amounts', () => {
    expect((component as any).pendingFeeTotal()).toBe(350);
  });

  it('should set loading to false after data loads', () => {
    expect((component as any).loading()).toBeFalse();
  });

  it('should set loading to false on transaction error', async () => {
    transactionSvc.apiFinancialTransactionGet.and.returnValue(throwError(() => new Error('fail')));
    monthlyFeeSvc.apiMonthlyFeeOverdueGet.and.returnValue(of([]) as any);
    const f2 = TestBed.createComponent(FinancialSummaryComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).loading()).toBeFalse();
  });

  it('formatCurrency should return Brazilian Real format', () => {
    const result = (component as any).formatCurrency(1500);
    expect(result).toContain('1.500');
    expect(result).toContain('R$');
  });
});
