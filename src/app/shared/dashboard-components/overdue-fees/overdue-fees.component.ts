import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { ShowAccountsReceivableDTO } from '../../../generated_services/model/showAccountsReceivableDTO';

@Component({
  selector: 'app-overdue-fees',
  standalone: true,
  imports: [],
  templateUrl: './overdue-fees.component.html',
  styleUrl: './overdue-fees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueFeesComponent implements OnInit {
  private readonly accountsReceivableService = inject(AccountsReceivableService);

  protected readonly fees = signal<ShowAccountsReceivableDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.accountsReceivableService
      .apiAccountsReceivableOverdueGet(
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1 as any, 50 as any,
      )
      .subscribe({
        next: (result) => {
          this.fees.set(result?.items ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[OverdueFees] API error:', err);
          this.error.set('Não foi possível carregar as mensalidades vencidas.');
          this.loading.set(false);
        },
      });
  }

  protected getAmount(item: ShowAccountsReceivableDTO): number {
    return (item.amount as unknown as number) ?? 0;
  }

  protected formatCurrency(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  protected daysOverdue(dateStr: string | null | undefined): number {
    if (!dateStr) return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    const due = Date.UTC(y, m - 1, d);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((today - due) / 86_400_000));
  }
}
