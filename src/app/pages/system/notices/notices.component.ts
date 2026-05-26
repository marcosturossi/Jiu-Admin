import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NoticesService } from '../../../generated_services/api/notices.service';
import { ShowNoticeDto } from '../../../generated_services/model/showNoticeDto';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';
import { CreateNoticeComponent } from './create-notice/create-notice.component';
import { UpdateNoticeComponent } from './update-notice/update-notice.component';

@Component({
  selector: 'app-notices',
  imports: [
    DatePipe,
    FilterComponent,
    PaginationComponent,
    CreateNoticeComponent,
    UpdateNoticeComponent,
  ],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticesComponent {
  private readonly noticesService = inject(NoticesService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowNoticeDto> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowNoticeDto | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Avisos');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.noticesService.apiNoticesGet(
      this.filterText() || undefined,
      undefined,
      undefined,
      undefined,
      this.currentPage(),
      this.pageSize(),
    ).subscribe({
      next: result => {
        this.items.set({
          items: result?.items ?? [],
          totalCount: result?.totalCount ?? 0,
          totalPages: result?.totalPages ?? 1,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro ao Carregar Avisos!', 'Não foi possível carregar a lista de avisos. Tente novamente.');
      },
    });
  }

  protected onFilterChange(output: FilterOutput): void {
    this.filterText.set(output.text || undefined);
    this.currentPage.set(1);
    this.load();
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowNoticeDto): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowNoticeDto): void {
    if (!confirm(`Tem certeza que deseja excluir o aviso "${item.description}"?`)) return;
    this.noticesService.apiNoticesIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Aviso Excluído!', 'O aviso foi excluído com sucesso.'); this.load(); },
      error: () => { this.notificationService.showError('Erro ao Excluir Aviso!', 'Não foi possível excluir o aviso. Tente novamente.'); }
    });
  }
}
