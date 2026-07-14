import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CashflowChartComponent } from './cashflow-chart.component';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { AccountsPayableService } from '../../../generated_services/api/accountsPayable.service';
import { ThemeService } from '../../../services/theme.service';
import { signal } from '@angular/core';

describe('CashflowChartComponent', () => {
  let component: CashflowChartComponent;
  let fixture: ComponentFixture<CashflowChartComponent>;
  let receivableSvc: jasmine.SpyObj<AccountsReceivableService>;
  let payableSvc: jasmine.SpyObj<AccountsPayableService>;
  let themeServiceStub: Partial<ThemeService>;

  beforeEach(async () => {
    receivableSvc = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableGet']);
    payableSvc = jasmine.createSpyObj('AccountsPayableService', ['apiAccountsPayableGet']);
    receivableSvc.apiAccountsReceivableGet.and.returnValue(of({ items: [], totalCount: 0 } as any));
    payableSvc.apiAccountsPayableGet.and.returnValue(of({ items: [], totalCount: 0 } as any));
    themeServiceStub = {
      currentTheme: signal<any>('light'),
      getChartTheme: () => ({ color: [], tooltip: {}, legend: {}, axisLine: {}, label: {}, splitLine: {} }),
    };

    await TestBed.configureTestingModule({
      imports: [CashflowChartComponent],
      providers: [
        { provide: AccountsReceivableService, useValue: receivableSvc },
        { provide: AccountsPayableService, useValue: payableSvc },
        { provide: ThemeService, useValue: themeServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CashflowChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call both accounts APIs on view init', () => {
    expect(receivableSvc.apiAccountsReceivableGet).toHaveBeenCalled();
    expect(payableSvc.apiAccountsPayableGet).toHaveBeenCalled();
  });

  it('should not throw when APIs return empty items', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should handle API error gracefully', () => {
    receivableSvc.apiAccountsReceivableGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(CashflowChartComponent);
    expect(() => f2.detectChanges()).not.toThrow();
  });

  it('should render chart container element', () => {
    const chartEl = fixture.nativeElement.querySelector('.chart-container');
    expect(chartEl).toBeTruthy();
  });
});
