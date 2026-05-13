import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TransactionCategoryService, PaginationTransactionCategoryDTO, ShowTransactionCategoryDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateTransactionCategoryComponent } from './create-transaction-category/create-transaction-category.component';
import { UpdateTransactionCategoryComponent } from './update-transaction-category/update-transaction-category.component';

@Component({
  selector: 'app-transaction-categories',
  standalone: true,
  imports: [
    DatePipe,
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
  protected readonly items = signal<PaginationTransactionCategoryDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowTransactionCategoryDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal('');

  constructor() {
    this.subnavService.setTitle('Categorias de Transação');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.service.apiTransactionCategoryGet(this.filterText() || undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro', 'Não foi possível carregar.'); }
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.filterText.set(term); this.currentPage.set(1); this.load(); }
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
