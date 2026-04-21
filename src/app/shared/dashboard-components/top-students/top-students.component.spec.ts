import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TopStudentsComponent } from './top-students.component';
import { DashboardService } from '../../../generated_services';

describe('TopStudentsComponent', () => {
  let component: TopStudentsComponent;
  let fixture: ComponentFixture<TopStudentsComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  const MOCK_TOP = [
    { studentId: '1', name: 'Carlos Silva', totalFrequencies: 40 },
    { studentId: '2', name: 'Ana Costa', totalFrequencies: 35 },
  ] as any[];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DashboardService', ['apiDashboardTopStudentsGet']);
    await TestBed.configureTestingModule({
      imports: [TopStudentsComponent],
      providers: [{ provide: DashboardService, useValue: spy }],
    }).compileComponents();
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
  });

  it('should create', () => {
    dashboardService.apiDashboardTopStudentsGet.and.returnValue(of(MOCK_TOP as any));
    fixture = TestBed.createComponent(TopStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should populate topStudents signal on success', () => {
    dashboardService.apiDashboardTopStudentsGet.and.returnValue(of(MOCK_TOP as any));
    fixture = TestBed.createComponent(TopStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect((component as any).topStudents()).toEqual(MOCK_TOP);
    expect((component as any).loading()).toBeFalse();
  });

  it('should set error signal on failure', () => {
    dashboardService.apiDashboardTopStudentsGet.and.returnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(TopStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect((component as any).error()).toBeTruthy();
    expect((component as any).loading()).toBeFalse();
  });
});
