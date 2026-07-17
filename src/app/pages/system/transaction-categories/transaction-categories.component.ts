import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TransactionCategoryService, ShowTransactionCategoryDTO as ShowTransactionCategoryDTO } from '../../../generated_services';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { SubnavService } from '../../../services/subnav.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateTransactionCategoryComponent } from './create-transaction-category/create-transaction-category.component';
import { UpdateTransactionCategoryComponent } from './update-transaction-category/update-transaction-category.component';
import { PageResult } from '../../../utils/page-result';

@Component({
  selector: 'app-transaction-categories',
  standalone: true,
  imports: [
    DatePipe,
    FilterComponent,
    PaginationComponent,
    CreateTransactionCategoryComponent,
    UpdateTransactionCategoryComponent,
  ],
  templateUrl: './transaction-categories.component.html',
  styleUrl: './transaction-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionCategoriesComponent {
  private readonly service = inject(TransactionCategoryService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowTransactionCategoryDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowTransactionCategoryDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Categorias de Transação');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.service.apiTransactionCategoryGet(this.filterText() || undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
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
        this.notificationService.showError('Erro', 'Não foi possível carregar.');
      },
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowTransactionCategoryDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async delete(item: ShowTransactionCategoryDTO): Promise<void> {
    const ok = await this.confirmService.confirm(`Tem certeza que deseja excluir a categoria "${item.name}"?`);
    if (!ok) return;
    this.service.apiTransactionCategoryIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Excluído!', 'Categoria excluída com sucesso.'); this.load(); },
      error: (err) => { this.notificationService.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir a categoria.')); }
    });
  }
}
