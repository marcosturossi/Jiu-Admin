import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LessonSchedulesComponent } from './lesson-schedules.component';
import { LessonScheduleService } from '../../../generated_services/api/lessonSchedule.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowLessonScheduleDTO } from '../../../generated_services/model/showLessonScheduleDTO';
import { DayOfWeek } from '../../../generated_services/model/dayOfWeek';

const MOCK_SCHEDULE: ShowLessonScheduleDTO = {
  id: 'ls1',
  title: 'Jiu-Jitsu Fundamentos',
  dayOfWeek: DayOfWeek.Monday,
  startTime: '19:00:00',
  duration: '01:00:00',
  isActive: true,
};

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_SCHEDULE, id: `ls${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('LessonSchedulesComponent', () => {
  let component: LessonSchedulesComponent;
  let fixture: ComponentFixture<LessonSchedulesComponent>;
  let lessonScheduleService: jasmine.SpyObj<LessonScheduleService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('LessonScheduleService', ['apiLessonScheduleGet', 'apiLessonScheduleIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    serviceSpy.apiLessonScheduleGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[2] ?? 1), Number(args[3] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [LessonSchedulesComponent],
      providers: [
        { provide: LessonScheduleService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonSchedulesComponent);
    component = fixture.componentInstance;
    lessonScheduleService = TestBed.inject(LessonScheduleService) as jasmine.SpyObj<LessonScheduleService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load schedules into the signal on init', () => {
    expect((component as any).items().items.length).toBe(10);
  });

  it('should show an error and stop loading when the initial load fails', () => {
    lessonScheduleService.apiLessonScheduleGet.and.returnValue(throwError(() => new Error('network down')));
    const f2 = TestBed.createComponent(LessonSchedulesComponent);
    f2.detectChanges();
    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    lessonScheduleService.apiLessonScheduleGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(lessonScheduleService.apiLessonScheduleGet).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    lessonScheduleService.apiLessonScheduleGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((component as any).items().items.length).toBe(20);
  });

  it('should format the day of week label', () => {
    expect((component as any).dayOfWeekLabel(DayOfWeek.Monday)).toBe('Segunda-feira');
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      lessonScheduleService.apiLessonScheduleIdDelete.and.returnValue(of(null as any));
      lessonScheduleService.apiLessonScheduleGet.calls.reset();
    });

    it('should delete schedule and reload on confirmation', async () => {
      await (component as any).delete(MOCK_SCHEDULE);
      expect(lessonScheduleService.apiLessonScheduleIdDelete).toHaveBeenCalledWith(MOCK_SCHEDULE.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(lessonScheduleService.apiLessonScheduleGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_SCHEDULE);
      expect(lessonScheduleService.apiLessonScheduleIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      lessonScheduleService.apiLessonScheduleIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_SCHEDULE);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
