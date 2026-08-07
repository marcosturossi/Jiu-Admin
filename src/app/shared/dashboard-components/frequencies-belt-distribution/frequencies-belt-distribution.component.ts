import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, effect } from '@angular/core';
import { DashboardService } from '../../../generated_services';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-frequencies-belt-distribution',
  templateUrl: './frequencies-belt-distribution.component.html',
  styleUrls: ['./frequencies-belt-distribution.component.scss']
})
export class FrequenciesBeltDistributionComponent implements AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);

  @ViewChild('chart', { static: true }) chartEl!: ElementRef;
  private chart: any;
  private resizeObserver?: ResizeObserver;
  private data: { name: string; value: number }[] = [];
  private themeService = inject(ThemeService);

  private palette = ['#2f80ed', '#34c38f', '#f6c343', '#f66d9b'];

  constructor() {
    // Re-render chart when theme changes
    effect(() => {
      const _ = this.themeService.currentTheme();
      if (this.chart && this.data.length > 0) {
        const option = this.getBaseOptions('Faixas mais presentes');
        option.xAxis.data = this.data.map(d => d.name);
        option.series = [{ type: 'bar', data: this.data.map(d => d.value), label: { show: true, position: 'top' }, itemStyle: { borderRadius: [6,6,0,0] } }];
        this.chart.setOption(option);
      }
    });
  }

  ngAfterViewInit(): void {
    const initIfSized = () => {
      const el = this.chartEl?.nativeElement as HTMLElement | undefined;
      if (!el) return false;
      const w = el.clientWidth;
      const h = el.clientHeight;
      return w > 0 && h > 0;
    };

    const loadAndInit = () => {
      import('echarts')
        .then((echartsModule) => {
          const echarts = (echartsModule as any).default ?? echartsModule;
          if (this.chart) {
            this.chart.dispose();
          }
          this.chart = echarts.init(this.chartEl.nativeElement);
          const option = this.getBaseOptions('Faixas mais presentes');
          option.xAxis.data = this.data.map(d => d.name);
          option.series = [{ type: 'bar', data: this.data.map(d => d.value), label: { show: true, position: 'top' }, itemStyle: { borderRadius: [6,6,0,0] } }];
          this.chart.setOption(option);
          window.addEventListener('resize', this.resize);
          this.fetchDataAndUpdate();
        })
        .catch(() => {
          // echarts not available — fail silently
        });
    };

    if (initIfSized()) {
      loadAndInit();
      return;
    }

    try {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 0 && cr.height > 0) {
            this.resizeObserver?.disconnect();
            loadAndInit();
            break;
          }
        }
      });
      this.resizeObserver.observe(this.chartEl.nativeElement);
      setTimeout(() => {
        if (!this.chart && initIfSized()) {
          this.resizeObserver?.disconnect();
          loadAndInit();
        }
      }, 1000);
    } catch {
      setTimeout(() => {
        loadAndInit();
      }, 200);
    }
  }

  private fetchDataAndUpdate(): void {
    this.dashboardService.apiDashboardFrequencyBeltsDistributionGet().subscribe({
      next: (data: any) => {
        if (!data) return;

        // API may return either an array of {name,value} or an object { legends, series, categories }
        if (Array.isArray(data)) {
          this.data = data.map((d: any) => ({ name: d.name, value: d.value }));
          if (this.chart) {
            const option = this.getBaseOptions('Faixas mais presentes');
            option.xAxis.data = this.data.map(d => d.name);
            option.series = [{ type: 'bar', data: this.data.map(d => d.value), label: { show: true, position: 'top' }, itemStyle: { borderRadius: [6,6,0,0] } }];
            this.chart.setOption(option);
          }
          return;
        }

        // object response with legends/series/categories
        const hasSeries = data.series && Array.isArray(data.series);
        const hasCategories = data.categories && Array.isArray(data.categories);
        if (hasSeries && hasCategories) {
          const series = data.series.map((s: any, _idx: number) => ({
            name: s.name,
            type: 'bar',
            data: s.data || [],
            label: { show: true, position: 'top' }
          }));
          const option: any = {
            ...this.getBaseOptions('Faixas mais presentes'),
            legend: { data: data.legends || series.map((s: any) => s.name) },
            xAxis: { type: 'category', data: data.categories },
            series
          };
          if (this.chart) this.chart.setOption(option);
          return;
        }

        // fallback: try to map whatever was returned
        try {
          const mapped = (data || []).map((d: any) => ({ name: d.name, value: d.value }));
          this.data = mapped;
          if (this.chart) {
            const option = this.getBaseOptions('Faixas mais presentes');
            option.xAxis.data = this.data.map(d => d.name);
            option.series = [{ type: 'bar', data: this.data.map(d => d.value), label: { show: true, position: 'top' }, itemStyle: { borderRadius: [6,6,0,0] } }];
            this.chart.setOption(option);
          }
        } catch {
          // ignore
        }
      },
      error: () => {
        // ignore for now
      }
    });
  }

  resize = () => {
    if (this.chart) this.chart.resize();
  };

  private getBaseOptions(_title: string) {
    const theme = this.themeService.getChartTheme();
    return {
      color: theme.color,
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...theme.tooltip },
      legend: { bottom: 10, ...theme.legend },
      grid: { left: 12, right: 12, top: 28, bottom: 48 },
      xAxis: { type: 'category', axisLine: theme.axisLine, axisLabel: theme.label },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: theme.splitLine, axisLabel: theme.label },
      series: []
    } as any;
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resize);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.chart) this.chart.dispose();
  }
}
