import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ShowLessonScheduleDTO } from '../../../../generated_services/model/showLessonScheduleDTO';
import { DayOfWeek } from '../../../../generated_services/model/dayOfWeek';
import { DAY_OF_WEEK_OPTIONS } from '../day-of-week-options';

const PX_PER_MINUTE = 1;
const MIN_BLOCK_HEIGHT = 24;
/** Gym hours fallback when there's no data yet to infer a range from. */
const DEFAULT_RANGE_START_HOUR = 6;
const DEFAULT_RANGE_END_HOUR = 22;
const EVENT_COLOR_PALETTE = ['evt-blue', 'evt-green', 'evt-purple', 'evt-orange', 'evt-red', 'evt-teal'];

interface PositionedEvent {
  schedule: ShowLessonScheduleDTO;
  top: number;
  height: number;
  columnIndex: number;
  columnCount: number;
  colorClass: string;
}

function parseTimeToMinutes(value: string | undefined): number {
  if (!value) return 0;
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

/** First-fit column assignment (same idea Google Calendar uses) so classes that overlap in the
 *  same day/time render side by side instead of stacked on top of each other. */
function layoutDay(daySchedules: ShowLessonScheduleDTO[], rangeStartMinutes: number): PositionedEvent[] {
  const withTimes = daySchedules
    .map(schedule => {
      const start = parseTimeToMinutes(schedule.startTime);
      const duration = parseTimeToMinutes(schedule.duration) || 30;
      return { schedule, start, end: start + duration };
    })
    .sort((a, b) => a.start - b.start);

  const columnEndTimes: number[] = [];
  const assigned = withTimes.map(entry => {
    let columnIndex = columnEndTimes.findIndex(end => end <= entry.start);
    if (columnIndex === -1) {
      columnIndex = columnEndTimes.length;
      columnEndTimes.push(entry.end);
    } else {
      columnEndTimes[columnIndex] = entry.end;
    }
    return { ...entry, columnIndex };
  });

  const columnCount = Math.max(1, columnEndTimes.length);

  return assigned.map(entry => ({
    schedule: entry.schedule,
    top: (entry.start - rangeStartMinutes) * PX_PER_MINUTE,
    height: Math.max(MIN_BLOCK_HEIGHT, (entry.end - entry.start) * PX_PER_MINUTE),
    columnIndex: entry.columnIndex,
    columnCount,
    colorClass: EVENT_COLOR_PALETTE[hashString(entry.schedule.title ?? '') % EVENT_COLOR_PALETTE.length],
  }));
}

@Component({
  selector: 'app-week-schedule-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './week-schedule-grid.component.html',
  styleUrl: './week-schedule-grid.component.scss',
})
export class WeekScheduleGridComponent {
  readonly schedules = input<ShowLessonScheduleDTO[]>([]);
  readonly editSchedule = output<ShowLessonScheduleDTO>();

  protected readonly days = DAY_OF_WEEK_OPTIONS;

  private readonly rangeStartHour = computed(() => {
    const items = this.schedules();
    if (items.length === 0) return DEFAULT_RANGE_START_HOUR;
    const minStart = Math.min(...items.map(s => parseTimeToMinutes(s.startTime)));
    return Math.min(DEFAULT_RANGE_START_HOUR, Math.max(0, Math.floor(minStart / 60)));
  });

  private readonly rangeEndHour = computed(() => {
    const items = this.schedules();
    if (items.length === 0) return DEFAULT_RANGE_END_HOUR;
    const maxEnd = Math.max(...items.map(s => parseTimeToMinutes(s.startTime) + (parseTimeToMinutes(s.duration) || 30)));
    return Math.max(DEFAULT_RANGE_END_HOUR, Math.min(24, Math.ceil(maxEnd / 60)));
  });

  protected readonly hourMarks = computed(() => {
    const start = this.rangeStartHour();
    const end = this.rangeEndHour();
    return Array.from({ length: end - start + 1 }, (_, i) => ({
      hour: start + i,
      offsetPx: i * 60 * PX_PER_MINUTE,
    }));
  });

  protected readonly gridHeight = computed(() => (this.rangeEndHour() - this.rangeStartHour()) * 60 * PX_PER_MINUTE);

  protected readonly eventsByDay = computed(() => {
    const rangeStartMinutes = this.rangeStartHour() * 60;
    const map = new Map<DayOfWeek, PositionedEvent[]>();
    for (const day of this.days) {
      map.set(day.value, layoutDay(this.schedules().filter(s => s.dayOfWeek === day.value), rangeStartMinutes));
    }
    return map;
  });

  protected eventsFor(day: DayOfWeek): PositionedEvent[] {
    return this.eventsByDay().get(day) ?? [];
  }

  protected onEventClick(schedule: ShowLessonScheduleDTO): void {
    this.editSchedule.emit(schedule);
  }

  /** Backend sends HH:mm:ss (a TimeSpan) — the grid only needs HH:mm. */
  protected formatTime(value: string | undefined): string {
    return value ? value.slice(0, 5) : '';
  }
}
