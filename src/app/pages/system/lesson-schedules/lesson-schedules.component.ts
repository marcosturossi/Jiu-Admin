import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LessonScheduleService } from '../../../generated_services/api/lessonSchedule.service';
import { ShowLessonScheduleDTO } from '../../../generated_services/model/showLessonScheduleDTO';
import { CreateLessonScheduleComponent } from './create-lesson-schedule/create-lesson-schedule.component';
import { UpdateLessonScheduleComponent } from './update-lesson-schedule/update-lesson-schedule.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';
import { activeBadge } from '../../../shared/status-badge';
import { dayOfWeekLabel } from './day-of-week-options';
import { WeekScheduleGridComponent } from './week-schedule-grid/week-schedule-grid.component';

/** No pagination in week view — the grid wants the whole week at once, and a school's schedule
 *  is small enough (dozens of classes) that one page covers it. 100 is the backend's hard cap
 *  (LessonScheduleFilterDTO throws above that) — it's also comfortably more than any real gym's
 *  weekly class count. */
const WEEK_VIEW_PAGE_SIZE = 100;

export type ScheduleViewMode = 'table' | 'week';

@Component({
  selector: 'app-lesson-schedules',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FilterComponent,
    PaginationComponent,
    CreateLessonScheduleComponent,
    UpdateLessonScheduleComponent,
    WeekScheduleGridComponent,
  ],
  templateUrl: './lesson-schedules.component.html',
  styleUrl: './lesson-schedules.component.scss',
})
export class LessonSchedulesComponent {
  private readonly lessonScheduleService = inject(LessonScheduleService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowLessonScheduleDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowLessonScheduleDTO | null>(null);
  protected readonly activeBadgeClass = (isActive: boolean | undefined) => activeBadge(isActive).cssClass;
  protected readonly dayOfWeekLabel = dayOfWeekLabel;
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);
  protected readonly viewMode = signal<ScheduleViewMode>('table');

  constructor() {
    this.subnavService.setTitle('Grade de Horários');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const isWeekView = this.viewMode() === 'week';
    const page = isWeekView ? 1 : this.currentPage();
    const pageSize = isWeekView ? WEEK_VIEW_PAGE_SIZE : this.pageSize();
    this.lessonScheduleService.apiLessonScheduleGet(this.filterText(), undefined, page, pageSize).subscribe({
      next: result => {
        this.items.set({
          items: result?.items ?? [],
          totalCount: (result?.totalCount as unknown as number) ?? 0,
          totalPages: (result?.totalPages as unknown as number) ?? 1,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro ao Carregar!', 'Não foi possível carregar a grade de horários. Tente novamente.');
      },
    });
  }

  protected setViewMode(mode: ScheduleViewMode): void {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.load();
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowLessonScheduleDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async delete(item: ShowLessonScheduleDTO): Promise<void> {
    const ok = await this.confirmService.confirm(`Tem certeza que deseja excluir o horário "${item.title}"?`);
    if (!ok) return;
    this.lessonScheduleService.apiLessonScheduleIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Horário Excluído!', `O horário "${item.title}" foi excluído com sucesso.`);
        this.load();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir o horário. Tente novamente.'));
      },
    });
  }
}
