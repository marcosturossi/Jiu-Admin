import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FinancialSummaryComponent } from './financial-summary.component';
import { FinancialOverviewService } from '../../../generated_services/api/financialOverview.service';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';

const MOCK_BALANCE = { totalReceivable: 1500, totalPayable: 200, balance: 1300 } as any;
const MOCK_SUMMARY = { totalReceivable: 1500, pendingFeesTotal: 350, overdueFeeCount: 2, activeContractCount: 10 } as any;

describe('FinancialSummaryComponent', () => {
  let component: FinancialSummaryComponent;
  let fixture: ComponentFixture<FinancialSummaryComponent>;
  let overviewSvc: jasmine.SpyObj<FinancialOverviewService>;
  let receivableSvc: jasmine.SpyObj<AccountsReceivableService>;

  beforeEach(async () => {
    overviewSvc = jasmine.createSpyObj('FinancialOverviewService', ['apiFinancialOverviewBalanceGet']);
    receivableSvc = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableSummaryGet']);
    overviewSvc.apiFinancialOverviewBalanceGet.and.returnValue(of(MOCK_BALANCE));
    receivableSvc.apiAccountsReceivableSummaryGet.and.returnValue(of(MOCK_SUMMARY));

    await TestBed.configureTestingModule({
      imports: [FinancialSummaryComponent],
      providers: [
        { provide: FinancialOverviewService, useValue: overviewSvc },
        { provide: AccountsReceivableService, useValue: receivableSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should set totalIncome from totalReceivable', () => {
    expect((component as any).totalIncome()).toBe(1500);
  });

  it('should set totalExpenses from totalPayable', () => {
    expect((component as any).totalExpenses()).toBe(200);
  });

  it('should set balance from balance', () => {
    expect((component as any).balance()).toBe(1300);
  });

  it('should set overdueFeeCount from summary', () => {
    expect((component as any).overdueFeeCount()).toBe(2);
  });

  it('should set pendingFeeTotal from summary', () => {
    expect((component as any).pendingFeeTotal()).toBe(350);
  });

  it('should set loading to false after data loads', () => {
    expect((component as any).loading()).toBeFalse();
  });

  it('should set loading to false on balance error', () => {
    overviewSvc.apiFinancialOverviewBalanceGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(FinancialSummaryComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).loading()).toBeFalse();
  });

  it('formatCurrency should return Brazilian Real format', () => {
    const result = (component as any).formatCurrency(1500);
    expect(result).toContain('1.500');
    expect(result).toContain('R$');
  });
});
