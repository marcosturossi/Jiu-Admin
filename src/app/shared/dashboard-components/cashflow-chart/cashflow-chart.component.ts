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
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { ThemeService } from '../../../services/theme.service';
import { TransactionType } from '../../../generated_services/model/transactionType';

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

  private readonly transactionService = inject(FinancialTransactionService);
  private readonly themeService = inject(ThemeService);

  private chart: any;
  private incomeByMonth: number[] = [];
  private expensesByMonth: number[] = [];
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

  private fetchData(): void {
    const now = new Date();
    const months: { label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: PT_MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
    }

    const dateFrom = new Date(months[0].year, months[0].month, 1).toISOString().split('T')[0];
    const dateTo = now.toISOString().split('T')[0];

    this.transactionService
      .apiFinancialTransactionGet(undefined, undefined, dateFrom, dateTo, undefined, 1, 2000)
      .subscribe({
        next: (data) => {
          const items = data?.items ?? [];
          this.monthLabels = months.map((m) => m.label);
          this.incomeByMonth = months.map((m) =>
            items
              .filter((t) => {
                const d = new Date(t.transactionDate ?? '');
                return t.type === TransactionType.NUMBER_0 && d.getFullYear() === m.year && d.getMonth() === m.month;
              })
              .reduce((sum, t) => sum + (t.amount ?? 0), 0)
          );
          this.expensesByMonth = months.map((m) =>
            items
              .filter((t) => {
                const d = new Date(t.transactionDate ?? '');
                return t.type === TransactionType.NUMBER_1 && d.getFullYear() === m.year && d.getMonth() === m.month;
              })
              .reduce((sum, t) => sum + (t.amount ?? 0), 0)
          );
          if (this.chart) {
            this.chart.setOption(this.buildOptions());
          }
        },
        error: () => {},
      });
  }

  private buildOptions(): any {
    const theme = this.themeService.getChartTheme();
    return {
      color: ['#16a34a', '#dc2626'],
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) =>
          params
            .map(
              (p: any) =>
                `${p.marker} ${p.seriesName}: ${(p.value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            )
            .join('<br/>'),
        ...theme.tooltip,
      },
      legend: { data: ['Receitas', 'Despesas'], bottom: 4, ...theme.legend },
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
          name: 'Receitas',
          type: 'bar',
          data: this.incomeByMonth,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          label: { show: false },
        },
        {
          name: 'Despesas',
          type: 'bar',
          data: this.expensesByMonth,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
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
