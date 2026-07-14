import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FinanceDashboardComponent } from './finance-dashboard.component';
import { SubnavService } from '../../../services/subnav.service';
import { FinancialOverviewService } from '../../../generated_services/api/financialOverview.service';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { AccountsPayableService } from '../../../generated_services/api/accountsPayable.service';
import { ThemeService } from '../../../services/theme.service';
import { signal } from '@angular/core';

describe('FinanceDashboardComponent', () => {
  let component: FinanceDashboardComponent;
  let fixture: ComponentFixture<FinanceDashboardComponent>;
  let subnavSpy: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const overviewSvc = jasmine.createSpyObj('FinancialOverviewService', ['apiFinancialOverviewBalanceGet']);
    overviewSvc.apiFinancialOverviewBalanceGet.and.returnValue(of({ totalReceivable: 0, totalPayable: 0, balance: 0 } as any));
    const receivableSvc = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableGet', 'apiAccountsReceivableSummaryGet']);
    receivableSvc.apiAccountsReceivableGet.and.returnValue(of({ items: [] } as any));
    receivableSvc.apiAccountsReceivableSummaryGet.and.returnValue(of({ overdueFeeCount: 0, pendingFeesTotal: 0 } as any));
    const payableSvc = jasmine.createSpyObj('AccountsPayableService', ['apiAccountsPayableGet']);
    payableSvc.apiAccountsPayableGet.and.returnValue(of({ items: [] } as any));
    const themeServiceStub: Partial<ThemeService> = {
      currentTheme: signal<any>('light'),
      getChartTheme: () => ({ color: [], tooltip: {}, legend: {}, axisLine: {}, label: {}, splitLine: {} }),
    };

    await TestBed.configureTestingModule({
      imports: [FinanceDashboardComponent],
      providers: [
        { provide: SubnavService, useValue: subnavSpy },
        { provide: FinancialOverviewService, useValue: overviewSvc },
        { provide: AccountsReceivableService, useValue: receivableSvc },
        { provide: AccountsPayableService, useValue: payableSvc },
        { provide: ThemeService, useValue: themeServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should set page title to "Dashboard Financeiro"', () => {
    expect(subnavSpy.setTitle).toHaveBeenCalledWith('Dashboard Financeiro');
  });

  it('should render financial-summary widget', () => {
    const el = fixture.nativeElement.querySelector('app-financial-summary');
    expect(el).toBeTruthy();
  });

  it('should render cashflow-chart widget', () => {
    const el = fixture.nativeElement.querySelector('app-cashflow-chart');
    expect(el).toBeTruthy();
  });

  it('should render overdue-fees widget', () => {
    const el = fixture.nativeElement.querySelector('app-overdue-fees');
    expect(el).toBeTruthy();
  });
});
