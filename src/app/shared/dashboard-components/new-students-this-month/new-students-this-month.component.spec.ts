import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NewStudentsThisMonthComponent } from './new-students-this-month.component';
import { DashboardService } from '../../../generated_services';

describe('NewStudentsThisMonthComponent', () => {
  let component: NewStudentsThisMonthComponent;
  let fixture: ComponentFixture<NewStudentsThisMonthComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DashboardService', ['apiDashboardNewStudentsGet']);
    await TestBed.configureTestingModule({
      imports: [NewStudentsThisMonthComponent],
      providers: [{ provide: DashboardService, useValue: spy }],
    }).compileComponents();
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
  });

  it('should create', () => {
    dashboardService.apiDashboardNewStudentsGet.and.returnValue(of({ newStudentsCount: 5 } as any));
    fixture = TestBed.createComponent(NewStudentsThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set count signal on success', () => {
    dashboardService.apiDashboardNewStudentsGet.and.returnValue(of({ newStudentsCount: 7 } as any));
    fixture = TestBed.createComponent(NewStudentsThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect((component as any).count()).toBe(7);
    expect((component as any).loading()).toBeFalse();
  });

  it('should set error signal on failure', () => {
    dashboardService.apiDashboardNewStudentsGet.and.returnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(NewStudentsThisMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect((component as any).error()).toBeTruthy();
    expect((component as any).loading()).toBeFalse();
  });
});
