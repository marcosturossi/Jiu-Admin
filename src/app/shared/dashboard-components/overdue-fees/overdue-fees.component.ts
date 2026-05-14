import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';
import { ShowMonthlyFeeDTO } from '../../../generated_services/model/showMonthlyFeeDTO';

@Component({
  selector: 'app-overdue-fees',
  standalone: true,
  imports: [],
  templateUrl: './overdue-fees.component.html',
  styleUrl: './overdue-fees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueFeesComponent implements OnInit {
  private readonly monthlyFeeService = inject(MonthlyFeeService);

  protected readonly fees = signal<ShowMonthlyFeeDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.monthlyFeeService.apiMonthlyFeeOverdueGet().subscribe({
      next: (data) => {
        this.fees.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[OverdueFees] API error:', err);
        this.error.set('Não foi possível carregar as mensalidades vencidas.');
        this.loading.set(false);
      },
    });
  }

  protected formatCurrency(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }

  protected daysOverdue(dateStr: string | null | undefined): number {
    if (!dateStr) return 0;
    const due = new Date(dateStr);
    const today = new Date();
    return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
  }
}
