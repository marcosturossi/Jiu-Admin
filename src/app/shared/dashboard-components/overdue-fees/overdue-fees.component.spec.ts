import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OverdueFeesComponent } from './overdue-fees.component';
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';

const MOCK_FEES = [
  { id: 'f1', amount: 150, dueDate: '2024-01-15' },
  { id: 'f2', amount: 200, dueDate: '2024-02-10' },
] as any[];

describe('OverdueFeesComponent', () => {
  let component: OverdueFeesComponent;
  let fixture: ComponentFixture<OverdueFeesComponent>;
  let monthlyFeeSvc: jasmine.SpyObj<MonthlyFeeService>;

  beforeEach(async () => {
    monthlyFeeSvc = jasmine.createSpyObj('MonthlyFeeService', ['apiMonthlyFeeOverdueGet']);
    monthlyFeeSvc.apiMonthlyFeeOverdueGet.and.returnValue(of({ items: MOCK_FEES } as any));

    await TestBed.configureTestingModule({
      imports: [OverdueFeesComponent],
      providers: [{ provide: MonthlyFeeService, useValue: monthlyFeeSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(OverdueFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should populate fees signal on success', () => {
    expect((component as any).fees()).toEqual(MOCK_FEES);
  });

  it('should set loading to false after data loads', () => {
    expect((component as any).loading()).toBeFalse();
  });

  it('should render a table row for each overdue fee', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should set error signal on API failure', async () => {
    monthlyFeeSvc.apiMonthlyFeeOverdueGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(OverdueFeesComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).error()).toBeTruthy();
    expect((f2.componentInstance as any).loading()).toBeFalse();
  });

  it('should show empty state when no overdue fees', () => {
    monthlyFeeSvc.apiMonthlyFeeOverdueGet.and.returnValue(of({ items: [] } as any));
    const f2 = TestBed.createComponent(OverdueFeesComponent);
    f2.detectChanges();
    const emptyState = f2.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('formatCurrency should return Brazilian Real format', () => {
    const result = (component as any).formatCurrency(1500);
    expect(result).toContain('R$');
    expect(result).toContain('1.500');
  });

  it('formatDate should return pt-BR formatted date', () => {
    const result = (component as any).formatDate('2024-01-15');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('daysOverdue should return a non-negative number', () => {
    const result = (component as any).daysOverdue('2023-01-01');
    expect(result).toBeGreaterThan(0);
  });
});
