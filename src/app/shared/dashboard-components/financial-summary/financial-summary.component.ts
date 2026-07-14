import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FinancialOverviewService } from '../../../generated_services/api/financialOverview.service';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [],
  templateUrl: './financial-summary.component.html',
  styleUrl: './financial-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialSummaryComponent implements OnInit {
  private readonly financialOverviewService = inject(FinancialOverviewService);
  private readonly accountsReceivableService = inject(AccountsReceivableService);

  protected readonly totalIncome = signal(0);
  protected readonly totalExpenses = signal(0);
  protected readonly balance = signal(0);
  protected readonly overdueFeeCount = signal(0);
  protected readonly pendingFeeTotal = signal(0);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.loadBalance();
    this.loadOverdueFees();
  }

  private loadBalance(): void {
    this.financialOverviewService.apiFinancialOverviewBalanceGet().subscribe({
      next: (result) => {
        this.totalIncome.set((result?.totalReceivable as unknown as number) ?? 0);
        this.totalExpenses.set((result?.totalPayable as unknown as number) ?? 0);
        this.balance.set((result?.balance as unknown as number) ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[FinancialSummary] API error:', err);
        this.loading.set(false);
      },
    });
  }

  private loadOverdueFees(): void {
    this.accountsReceivableService.apiAccountsReceivableSummaryGet().subscribe({
      next: (result) => {
        this.overdueFeeCount.set((result?.overdueFeeCount as unknown as number) ?? 0);
        this.pendingFeeTotal.set((result?.pendingFeesTotal as unknown as number) ?? 0);
      },
      error: (err) => {
        console.error('[FinancialSummary] Overdue fees API error:', err);
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
