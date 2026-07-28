import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { EMPTY, Observable, expand, forkJoin, reduce } from 'rxjs';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { AccountsPayableService } from '../../../generated_services/api/accountsPayable.service';
import { ThemeService } from '../../../services/theme.service';

/** Backend hard-caps PageSize at 100 (AccountsReceivable/PayableFilterDTO.Validate()), and an
 *  academy easily has more than 100 fee records across a 6-month window (one per student per
 *  month) — so a single page silently drops data. Walks every page and concatenates the items. */
function fetchAllPages<T>(
  fetchPage: (page: number) => Observable<{ items?: T[] | null; hasNextPage?: boolean | null }>,
  maxPages = 20,
): Observable<T[]> {
  return fetchPage(1).pipe(
    expand((result, index) =>
      result.hasNextPage && index + 1 < maxPages ? fetchPage(index + 2) : EMPTY
    ),
    reduce((acc: T[], result) => acc.concat(result.items ?? []), [] as T[])
  );
}

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-cashflow-chart',
  standalone: true,
  imports: [],
  templateUrl: './cashflow-chart.component.html',
  styleUrl: './cashflow-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashflowChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chart', { static: true }) chartEl!: ElementRef;

  private readonly accountsReceivableService = inject(AccountsReceivableService);
  private readonly accountsPayableService = inject(AccountsPayableService);
  private readonly themeService = inject(ThemeService);

  private chart: any;
  private receivedByMonth: number[] = [];
  private toReceiveByMonth: number[] = [];
  private paidByMonth: number[] = [];
  private toPayByMonth: number[] = [];
  private monthLabels: string[] = [];
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const _ = this.themeService.currentTheme();
      if (this.chart && this.monthLabels.length > 0) {
        this.chart.setOption(this.buildOptions());
      }
    });
  }

  ngAfterViewInit(): void {
    this.fetchData();

    const loadAndInit = () => {
      import('echarts')
        .then((echartsModule) => {
          const echarts = (echartsModule as any).default ?? echartsModule;
          if (this.chart) this.chart.dispose();
          this.chart = echarts.init(this.chartEl.nativeElement);
          this.chart.setOption(this.buildOptions());
          window.addEventListener('resize', this.resize);
        })
        .catch(() => {});
    };

    const el = this.chartEl?.nativeElement as HTMLElement;
    if (el && el.clientWidth > 0 && el.clientHeight > 0) {
      loadAndInit();
      return;
    }

    try {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            this.resizeObserver?.disconnect();
            loadAndInit();
            break;
          }
        }
      });
      this.resizeObserver.observe(this.chartEl.nativeElement);
      setTimeout(() => {
        if (!this.chart && el.clientWidth > 0) {
          this.resizeObserver?.disconnect();
          loadAndInit();
        }
      }, 1000);
    } catch {
      setTimeout(() => loadAndInit(), 200);
    }
  }

  /** Compares a `createdAt` DateTime string (real ISO instant, e.g. "2026-07-14T12:55:48.603Z")
   *  against a {year, month} bucket. Unlike DateOnly fields ("YYYY-MM-DD"), a DateTime should be
   *  read in local time per this app's convention — there's an actual time-of-day to convert. */
  private isInMonthLocal(dateStr: string | null | undefined, bucket: { year: number; month: number }): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === bucket.year && d.getMonth() === bucket.month;
  }

  private fetchData(): void {
    const now = new Date();
    const months: { label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: PT_MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
    }

    // Bucketed by `createdAt` (when the charge was invoiced/generated), not `dueDate` or
    // `transactionDate`: TransactionDate is left unset ("0001-01-01") for contract-generated
    // fees, and DueDate is often in a *future* month (fees are invoiced ahead of when they're
    // due) so a trailing-6-months window built on it misses most receivables. `createdAt` is
    // always a real, populated timestamp. The backend's transactionDateFrom/To filter actually
    // narrows by DueDate (Backend.Modules.Finances GetAccountsReceivable/PayableSpecification),
    // which doesn't line up with createdAt-based bucketing — so we don't apply it here and
    // instead page through everything, newest-created first, and filter by month client-side.
    forkJoin({
      receivableItems: fetchAllPages((page) =>
        this.accountsReceivableService.apiAccountsReceivableGet(
          undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, page as any, 100 as any, undefined, true,
        )
      ),
      payableItems: fetchAllPages((page) =>
        this.accountsPayableService.apiAccountsPayableGet(
          undefined, undefined, undefined, undefined, undefined, undefined, undefined, page as any, 100 as any, undefined, true,
        )
      ),
    }).subscribe({
      next: ({ receivableItems, payableItems }) => {
        this.monthLabels = months.map((m) => m.label);

        // Split each bar into "already settled" vs "still open" so a glance shows both
        // realized and expected cash flow. Cancelled/Refunded entries aren't real money
        // either way, so they're excluded from both segments.
        const sumWhere = (items: any[], m: { year: number; month: number }, statuses: string[]) =>
          items
            .filter((t: any) => this.isInMonthLocal(t.createdAt, m) && statuses.includes(t.status))
            .reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0);

        this.receivedByMonth = months.map((m) => sumWhere(receivableItems, m, ['Paid']));
        this.toReceiveByMonth = months.map((m) => sumWhere(receivableItems, m, ['Pending', 'Overdue']));
        this.paidByMonth = months.map((m) => sumWhere(payableItems, m, ['Paid']));
        this.toPayByMonth = months.map((m) => sumWhere(payableItems, m, ['Pending', 'Overdue']));

        if (this.chart) {
          this.chart.setOption(this.buildOptions());
        }
      },
      error: (err) => {
        console.error('[CashflowChart] API error:', err);
      },
    });
  }

  private buildOptions(): any {
    const theme = this.themeService.getChartTheme();
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const lines = params.map(
            (p: any) =>
              `${p.marker} ${p.seriesName}: ${(p.value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          );
          const income = (params[0]?.value ?? 0) + (params[1]?.value ?? 0);
          const expense = (params[2]?.value ?? 0) + (params[3]?.value ?? 0);
          lines.push(`<b>Saldo: ${(income - expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>`);
          return lines.join('<br/>');
        },
        ...theme.tooltip,
      },
      legend: { data: ['Recebido', 'A Receber', 'Pago', 'A Pagar'], bottom: 4, ...theme.legend },
      grid: { left: 12, right: 12, top: 16, bottom: 48, containLabel: true },
      xAxis: {
        type: 'category',
        data: this.monthLabels,
        axisLine: theme.axisLine,
        axisLabel: theme.label,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: theme.splitLine,
        axisLabel: {
          ...theme.label,
          formatter: (v: number) =>
            v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`,
        },
      },
      series: [
        {
          name: 'Recebido',
          type: 'bar',
          stack: 'receita',
          data: this.receivedByMonth,
          itemStyle: { color: '#16a34a' },
          label: { show: false },
        },
        {
          name: 'A Receber',
          type: 'bar',
          stack: 'receita',
          data: this.toReceiveByMonth,
          itemStyle: { color: '#86efac', borderRadius: [6, 6, 0, 0] },
          label: { show: false },
        },
        {
          name: 'Pago',
          type: 'bar',
          stack: 'despesa',
          data: this.paidByMonth,
          itemStyle: { color: '#dc2626' },
          label: { show: false },
        },
        {
          name: 'A Pagar',
          type: 'bar',
          stack: 'despesa',
          data: this.toPayByMonth,
          itemStyle: { color: '#fca5a5', borderRadius: [6, 6, 0, 0] },
          label: { show: false },
        },
      ],
    };
  }

  resize = () => {
    if (this.chart) this.chart.resize();
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resize);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.chart) this.chart.dispose();
  }
}
