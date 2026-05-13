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
          const items = data?.items ?? [];
          const income = items
            .filter((t) => t.type === TransactionType.NUMBER_0)
            .reduce((sum, t) => sum + (t.amount ?? 0), 0);
          const expenses = items
            .filter((t) => t.type === TransactionType.NUMBER_1)
            .reduce((sum, t) => sum + (t.amount ?? 0), 0);
          this.totalIncome.set(income);
          this.totalExpenses.set(expenses);
          this.balance.set(income - expenses);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadOverdueFees(): void {
    this.monthlyFeeService.apiMonthlyFeeOverdueGet().subscribe({
      next: (fees) => {
        this.overdueFeeCount.set(fees?.length ?? 0);
        const total = (fees ?? []).reduce(
          (sum, f) => sum + (f.amount ?? 0),
          0
        );
        this.pendingFeeTotal.set(total);
      },
      error: () => {},
    });
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
