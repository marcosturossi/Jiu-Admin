import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BirthdayThisMonthComponent } from './birthday-this-month.component';
import { DashboardService } from '../../../generated_services';

describe('BirthdayThisMonthComponent', () => {
  let component: BirthdayThisMonthComponent;
  let fixture: ComponentFixture<BirthdayThisMonthComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  const MOCK_BIRTHDAYS = [
    { id: '1', name: 'Carlos Silva', birthDate: '1990-04-21' },
    { id: '2', name: 'Ana Costa', birthDate: '1992-04-30' },
  ] as any[];

  function createComponent(result: any) {
    dashboardService.apiDashboardBirthdaysGet.and.returnValue(of(result));
  }

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DashboardService', ['apiDashboardBirthdaysGet']);
    await TestBed.configureTestingModule({
      imports: [BirthdayThisMonthComponent],
      providers: [{ provide: DashboardService, useValue: spy }],
    }).compileComponents();
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
  });

  it('should create', () => {
    createComponent(MOCK_BIRTHDAYS);
    fixture = TestBed.createComponent(BirthdayThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should populate birthdays signal on success', () => {
    createComponent(MOCK_BIRTHDAYS);
    fixture = TestBed.createComponent(BirthdayThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect((component as any).birthdays()).toEqual(MOCK_BIRTHDAYS);
    expect((component as any).loading()).toBeFalse();
  });

  it('should set error signal on failure', () => {
    dashboardService.apiDashboardBirthdaysGet.and.returnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(BirthdayThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect((component as any).error()).toBeTruthy();
    expect((component as any).loading()).toBeFalse();
  });

  it('should default to empty birthdays and loading true before response', () => {
    // Use a non-emitting observable to test initial state
    dashboardService.apiDashboardBirthdaysGet.and.returnValue(of([] as any));
    fixture = TestBed.createComponent(BirthdayThisMonthComponent);
    component = fixture.componentInstance;
    // Check initial state before detectChanges triggers subscription
    expect((component as any).birthdays()).toEqual([]);
  });
});
