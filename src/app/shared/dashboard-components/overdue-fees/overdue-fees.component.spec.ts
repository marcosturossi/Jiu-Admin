import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverdueFeesComponent } from './overdue-fees.component';

describe('OverdueFeesComponent', () => {
  let component: OverdueFeesComponent;
  let fixture: ComponentFixture<OverdueFeesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverdueFeesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OverdueFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

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
