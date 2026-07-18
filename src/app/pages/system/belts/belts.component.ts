import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BeltService, ShowBeltDTO as ShowBeltDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateBeltComponent } from './create-belt/create-belt.component';
import { UpdateBeltComponent } from './update-belt/update-belt.component';
import { PageResult } from '../../../utils/page-result';
import { forKidsBadgeClass } from '../../../shared/status-badge';

@Component({
  selector: 'app-belts',
  imports: [
    FilterComponent,
    PaginationComponent,
    CreateBeltComponent,
    UpdateBeltComponent,
  ],
  templateUrl: './belts.component.html',
  styleUrl: './belts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeltsComponent {
  private readonly beltService = inject(BeltService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowBeltDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowBeltDTO | null>(null);
  protected readonly forKidsBadgeClass = forKidsBadgeClass;
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Faixas');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.beltService.apiBeltGet(this.filterText(), undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
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
        this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de faixas.');
      },
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowBeltDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async delete(item: ShowBeltDTO): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Excluir Faixa',
      message: `Tem certeza que deseja excluir a faixa "${item.color}"? Esta ação não pode ser desfeita.`,
    });
    if (!ok) return;
    this.beltService.apiBeltIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Faixa Excluída!', `A faixa ${item.color} foi excluída com sucesso.`); this.load(); },
      error: (err) => { this.notificationService.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir a faixa. Tente novamente.')); }
    });
  }
}
