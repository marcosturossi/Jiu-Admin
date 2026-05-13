import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SubnavService } from '../../../services/subnav.service';
import { FinancialSummaryComponent } from '../../../shared/dashboard-components/financial-summary/financial-summary.component';
import { CashflowChartComponent } from '../../../shared/dashboard-components/cashflow-chart/cashflow-chart.component';
import { OverdueFeesComponent } from '../../../shared/dashboard-components/overdue-fees/overdue-fees.component';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [FinancialSummaryComponent, CashflowChartComponent, OverdueFeesComponent],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceDashboardComponent implements OnInit {
  private readonly subnavService = inject(SubnavService);

  ngOnInit(): void {
    this.subnavService.setTitle('Dashboard Financeiro');
  }
}
