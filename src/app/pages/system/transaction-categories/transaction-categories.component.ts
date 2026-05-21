import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TransactionCategoryService, CarlonGracieBackendFinancesApplicationDTOsShowTransactionCategoryDTO as ShowTransactionCategoryDTO } from '../../../generated_services';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateTransactionCategoryComponent } from './create-transaction-category/create-transaction-category.component';
import { UpdateTransactionCategoryComponent } from './update-transaction-category/update-transaction-category.component';
import { ODataPage, buildClientPage, parseODataPage } from '../../../utils/odata.utils';

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

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowTransactionCategoryDTO> | null>(null);
  protected readonly allItems = signal<ShowTransactionCategoryDTO[]>([]);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowTransactionCategoryDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterQuery = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Categorias de Transação');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const filter = this.filterQuery();
    this.service.apiTransactionCategoryGet(filter, undefined, '200', '0', 'true').subscribe({
      next: (body: any) => {
        const page = parseODataPage<ShowTransactionCategoryDTO>(body, 200);
        this.allItems.set(page.items);
        this.refreshPage();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro', 'Não foi possível carregar.'); }
    });
  }

  private refreshPage(): void {
    const page = buildClientPage(this.allItems(), this.currentPage(), this.pageSize());
    this.currentPage.set(page.currentPage);
    this.items.set(page);
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.refreshPage(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.refreshPage(); }
  protected onFilterChange(output: FilterOutput): void { this.filterQuery.set(output.odataFilter); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowTransactionCategoryDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowTransactionCategoryDTO): void {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    this.service.apiTransactionCategoryIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Excluído!', 'Categoria excluída com sucesso.'); this.load(); },
      error: () => { this.notificationService.showError('Erro ao Excluir!', 'Não foi possível excluir a categoria.'); }
    });
  }
}
