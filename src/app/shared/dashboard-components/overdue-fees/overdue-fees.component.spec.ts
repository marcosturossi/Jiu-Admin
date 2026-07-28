import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OverdueFeesComponent } from './overdue-fees.component';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';

const MOCK_FEES = { items: [{ id: '1', dueDate: '2024-01-15', amount: 150 }] } as any;

describe('OverdueFeesComponent', () => {
  let component: OverdueFeesComponent;
  let fixture: ComponentFixture<OverdueFeesComponent>;
  let receivableSvc: jasmine.SpyObj<AccountsReceivableService>;

  beforeEach(async () => {
    receivableSvc = jasmine.createSpyObj('AccountsReceivableService', ['apiAccountsReceivableOverdueGet']);
    receivableSvc.apiAccountsReceivableOverdueGet.and.returnValue(of(MOCK_FEES));

    await TestBed.configureTestingModule({
      imports: [OverdueFeesComponent],
      providers: [
        { provide: AccountsReceivableService, useValue: receivableSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverdueFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load fees and set loading to false', () => {
    expect((component as any).fees()).toEqual(MOCK_FEES.items);
    expect((component as any).loading()).toBeFalse();
  });

  it('should set error and loading to false on API error', () => {
    receivableSvc.apiAccountsReceivableOverdueGet.and.returnValue(throwError(() => new Error('fail')));
    const f2 = TestBed.createComponent(OverdueFeesComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).loading()).toBeFalse();
    expect((f2.componentInstance as any).error()).toBeTruthy();
  });

  it('getAmount should read the numeric amount', () => {
    expect((component as any).getAmount({ amount: 150 })).toBe(150);
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

  it('formatDate should return em dash for missing date', () => {
    expect((component as any).formatDate(null)).toBe('—');
  });

  it('daysOverdue should return a non-negative number', () => {
    const result = (component as any).daysOverdue('2023-01-01');
    expect(result).toBeGreaterThan(0);
  });
});
