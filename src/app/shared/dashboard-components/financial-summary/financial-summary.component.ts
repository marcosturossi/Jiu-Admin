import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { TransactionType } from '../../../generated_services/model/transactionType';
import { ShowMonthlyFeeDTO } from '../../../generated_services/model/showMonthlyFeeDTO';

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
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    this.transactionService
      .apiFinancialTransactionGet(undefined, undefined, undefined)
      .subscribe({
        next: (body: any) => {
          const items = Array.isArray(body) ? body : (body?.value ?? []);
          const thisMonth = items.filter((t: any) => {
            const d = new Date(t.transactionDate ?? '');
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          const income = thisMonth
            .filter((t: any) => {
              const type = normalizeTransactionType(t.type);
              return type === TransactionType.Income
            })
            .reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0);
          const expenses = thisMonth
            .filter((t: any) => {
              const type = normalizeTransactionType(t.type);
              return type === TransactionType.Expense
            })
            .reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0);
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
   
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
