import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';
import { TransactionType } from '../../../generated_services/model/transactionType';

// Map backend values to frontend enum string values
// The backend might return numeric 0/1 or strings 'Income'/'Expense'
function normalizeTransactionType(type: any): TransactionType | undefined {
  // Handle string values
  if (type === 'Income' || type === TransactionType.Income) return TransactionType.Income;
  if (type === 'Expense' || type === TransactionType.Expense) return TransactionType.Expense;
  // Handle numeric values (0 = Income, 1 = Expense from old backend)
  if (type === 0 || type === '0') return TransactionType.Income;
  if (type === 1 || type === '1') return TransactionType.Expense;
  // Handle other string enum values
  if (type === 'Debit' || type === TransactionType.Debit) return TransactionType.Debit;
  if (type === 'Credit' || type === TransactionType.Credit) return TransactionType.Credit;
  if (type === 'Refund' || type === TransactionType.Refund) return TransactionType.Refund;
  if (type === 'Adjustment' || type === TransactionType.Adjustment) return TransactionType.Adjustment;
  // Handle numeric values for new enum order (2-5)
  if (type === 2) return TransactionType.Refund;
  if (type === 3) return TransactionType.Adjustment;
  if (type === 4) return TransactionType.Income;
  if (type === 5) return TransactionType.Expense;
  return undefined;
}

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [],
  templateUrl: './financial-summary.component.html',
  styleUrl: './financial-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialSummaryComponent implements OnInit {
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly monthlyFeeService = inject(MonthlyFeeService);

  protected readonly totalIncome = signal(0);
  protected readonly totalExpenses = signal(0);
  protected readonly balance = signal(0);
  protected readonly overdueFeeCount = signal(0);
  protected readonly pendingFeeTotal = signal(0);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.loadTransactionSummary();
    this.loadOverdueFees();
  }

  private loadTransactionSummary(): void {
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const dateTo = now.toISOString().split('T')[0];

    console.log('[FinancialSummary] Loading transactions', { dateFrom, dateTo });
    console.log('[FinancialSummary] TransactionType enum:', TransactionType);

    this.transactionService
      .apiFinancialTransactionGet(
        undefined,
        undefined,
        dateFrom,
        dateTo,
        undefined,
        1,
        1000
      )
      .subscribe({
        next: (data) => {
          console.log('[FinancialSummary] API response:', data);
          const items = data?.items ?? [];
          console.log('[FinancialSummary] Items count:', items.length);
          if (items.length > 0) {
            console.log('[FinancialSummary] First item:', items[0]);
            console.log('[FinancialSummary] Checking type values:');
            items.forEach((t, idx) => {
              const normalized = normalizeTransactionType(t.type);
              console.log(`  Item ${idx}: type=${t.type}, normalized=${normalized}, income match=${normalized === TransactionType.Income}, expense match=${normalized === TransactionType.Expense}`);
            });
          }
          const income = items
            .filter((t) => normalizeTransactionType(t.type) === TransactionType.Income)
            .reduce((sum, t) => sum + (t.amount ?? 0), 0);
          const expenses = items
            .filter((t) => normalizeTransactionType(t.type) === TransactionType.Expense)
            .reduce((sum, t) => sum + (t.amount ?? 0), 0);
          console.log('[FinancialSummary] Calculated:', { income, expenses });
          this.totalIncome.set(income);
          this.totalExpenses.set(expenses);
          this.balance.set(income - expenses);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[FinancialSummary] API error:', err);
          this.loading.set(false);
        },
      });
  }

  private loadOverdueFees(): void {
    console.log('[FinancialSummary] Loading overdue fees');
    this.monthlyFeeService.apiMonthlyFeeOverdueGet().subscribe({
      next: (fees) => {
        console.log('[FinancialSummary] Overdue fees response:', fees);
        this.overdueFeeCount.set(fees?.length ?? 0);
        const total = (fees ?? []).reduce(
          (sum, f) => sum + (f.amount ?? 0),
          0
        );
        this.pendingFeeTotal.set(total);
      },
      error: (err) => {
        console.error('[FinancialSummary] Overdue fees error:', err);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
