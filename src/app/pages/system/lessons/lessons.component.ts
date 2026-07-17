import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ShowLessonDTO } from '../../../generated_services/model/showLessonDTO';
import { LessonService } from '../../../generated_services';
import { CreateLessonComponent } from './create-lesson/create-lesson.component';
import { UpdateLessonComponent } from './update-lesson/update-lesson.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';

@Component({
  selector: 'app-lessons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FilterComponent,
    PaginationComponent,
    CreateLessonComponent,
    UpdateLessonComponent,
    DatePipe,
  ],
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.scss',
})
export class LessonsComponent {
  private readonly lessonService = inject(LessonService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowLessonDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowLessonDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Aulas');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.lessonService.apiLessonGet(this.filterText(), this.currentPage(), this.pageSize()).subscribe({
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
        this.notificationService.showError('Erro ao Carregar Aulas!', 'Não foi possível carregar a lista de aulas. Tente novamente.');
      },
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowLessonDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async delete(item: ShowLessonDTO): Promise<void> {
    const ok = await this.confirmService.confirm(`Tem certeza que deseja excluir a aula "${item.title}"?`);
    if (!ok) return;
    this.lessonService.apiLessonIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Aula Excluída!', `A aula "${item.title}" foi excluída com sucesso.`);
        this.load();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Excluir Aula!', extractErrorMessage(err, 'Não foi possível excluir a aula. Tente novamente.'));
      },
    });
  }
}
