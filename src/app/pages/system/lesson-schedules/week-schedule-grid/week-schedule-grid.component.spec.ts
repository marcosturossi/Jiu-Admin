import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekScheduleGridComponent } from './week-schedule-grid.component';
import { ShowLessonScheduleDTO } from '../../../../generated_services/model/showLessonScheduleDTO';
import { DayOfWeek } from '../../../../generated_services/model/dayOfWeek';

const scheduleFixture = (overrides: Partial<ShowLessonScheduleDTO>): ShowLessonScheduleDTO => ({
  id: 'ls1',
  title: 'Jiu-Jitsu Fundamentos',
  dayOfWeek: DayOfWeek.Monday,
  startTime: '19:00:00',
  duration: '01:00:00',
  isActive: true,
  ...overrides,
});

describe('WeekScheduleGridComponent', () => {
  let component: WeekScheduleGridComponent;
  let fixture: ComponentFixture<WeekScheduleGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekScheduleGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WeekScheduleGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should list all 7 days in Monday-first order', () => {
    fixture.detectChanges();
    expect((component as any).days.map((d: any) => d.value)).toEqual([
      DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday,
      DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday,
    ]);
  });

  it('should place a schedule under its own day of week and no other', () => {
    fixture.componentRef.setInput('schedules', [scheduleFixture({ dayOfWeek: DayOfWeek.Wednesday })]);
    fixture.detectChanges();

    expect((component as any).eventsFor(DayOfWeek.Wednesday).length).toBe(1);
    expect((component as any).eventsFor(DayOfWeek.Monday).length).toBe(0);
  });

  it('should position a block using minutes-from-range-start for top and duration for height', () => {
    // Default gym-hours range starts at 06:00, so 07:00 start = 60 minutes in = 60px top.
    fixture.componentRef.setInput('schedules', [scheduleFixture({ startTime: '07:00:00', duration: '01:30:00' })]);
    fixture.detectChanges();

    const [positioned] = (component as any).eventsFor(DayOfWeek.Monday);
    expect(positioned.top).toBe(60);
    expect(positioned.height).toBe(90);
  });

  it('should widen the visible hour range to fit classes outside the default 06:00-22:00 window', () => {
    fixture.componentRef.setInput('schedules', [scheduleFixture({ startTime: '23:00:00', duration: '01:00:00' })]);
    fixture.detectChanges();

    const marks = (component as any).hourMarks();
    expect(marks[marks.length - 1].hour).toBe(24);
  });

  it('should assign overlapping same-day classes to separate side-by-side columns', () => {
    fixture.componentRef.setInput('schedules', [
      scheduleFixture({ id: 'a', startTime: '19:00:00', duration: '01:00:00' }),
      scheduleFixture({ id: 'b', startTime: '19:15:00', duration: '01:00:00' }),
    ]);
    fixture.detectChanges();

    const positioned = (component as any).eventsFor(DayOfWeek.Monday);
    expect(positioned.length).toBe(2);
    expect(positioned[0].columnCount).toBe(2);
    expect(new Set(positioned.map((p: any) => p.columnIndex)).size).toBe(2);
  });

  it('should not split non-overlapping classes on the same day into separate columns', () => {
    fixture.componentRef.setInput('schedules', [
      scheduleFixture({ id: 'a', startTime: '18:00:00', duration: '01:00:00' }),
      scheduleFixture({ id: 'b', startTime: '20:00:00', duration: '01:00:00' }),
    ]);
    fixture.detectChanges();

    const positioned = (component as any).eventsFor(DayOfWeek.Monday);
    expect(positioned.every((p: any) => p.columnCount === 1)).toBeTrue();
  });

  it('should emit editSchedule with the clicked schedule', () => {
    const schedule = scheduleFixture({});
    let emitted: ShowLessonScheduleDTO | undefined;
    component.editSchedule.subscribe(s => (emitted = s));

    (component as any).onEventClick(schedule);

    expect(emitted).toEqual(schedule);
  });

  it('should trim seconds off the HH:mm:ss time the backend sends', () => {
    fixture.detectChanges();
    expect((component as any).formatTime('19:00:00')).toBe('19:00');
    expect((component as any).formatTime(undefined)).toBe('');
  });

  it('should assign the same color to two schedules with the same title', () => {
    fixture.componentRef.setInput('schedules', [
      scheduleFixture({ id: 'a', title: 'Muay Thai', dayOfWeek: DayOfWeek.Monday }),
      scheduleFixture({ id: 'b', title: 'Muay Thai', dayOfWeek: DayOfWeek.Tuesday }),
    ]);
    fixture.detectChanges();

    const [mon] = (component as any).eventsFor(DayOfWeek.Monday);
    const [tue] = (component as any).eventsFor(DayOfWeek.Tuesday);
    expect(mon.colorClass).toBe(tue.colorClass);
  });
});
