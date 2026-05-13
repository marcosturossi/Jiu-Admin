import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CashflowChartComponent } from './cashflow-chart.component';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { ThemeService } from '../../../services/theme.service';
import { signal } from '@angular/core';

describe('CashflowChartComponent', () => {
  let component: CashflowChartComponent;
  let fixture: ComponentFixture<CashflowChartComponent>;
  let transactionSvc: jasmine.SpyObj<FinancialTransactionService>;
  let themeServiceStub: Partial<ThemeService>;

  beforeEach(async () => {
    transactionSvc = jasmine.createSpyObj('FinancialTransactionService', ['apiFinancialTransactionGet']);
    transactionSvc.apiFinancialTransactionGet.and.returnValue(of({ items: [], totalItems: 0 } as any));
    themeServiceStub = {
      currentTheme: signal<any>('light'),
      getChartTheme: () => ({ color: [], tooltip: {}, legend: {}, axisLine: {}, label: {}, splitLine: {} }),
    };

    await TestBed.configureTestingModule({
      imports: [CashflowChartComponent],
      providers: [
        { provide: FinancialTransactionService, useValue: transactionSvc },
        { provide: ThemeService, useValue: themeServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CashflowChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call apiFinancialTransactionGet on view init', () => {
    expect(transactionSvc.apiFinancialTransactionGet).toHaveBeenCalled();
  });

  it('should not throw when transaction API returns empty items', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should handle API error gracefully', () => {
    transactionSvc.apiFinancialTransactionGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(CashflowChartComponent);
    expect(() => f2.detectChanges()).not.toThrow();
  });

  it('should render chart container element', () => {
    const chartEl = fixture.nativeElement.querySelector('.chart-container');
    expect(chartEl).toBeTruthy();
  });
});
