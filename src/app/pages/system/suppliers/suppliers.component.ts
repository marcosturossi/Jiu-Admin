import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';

import { SupplierService } from '../../../generated_services/api/supplier.service';
import { ShowSupplierDTO } from '../../../generated_services/model/showSupplierDTO';
import { PaginatedResultOfShowSupplierDTO } from '../../../generated_services/model/paginatedResultOfShowSupplierDTO';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateSupplierComponent } from './create-supplier/create-supplier.component';
import { UpdateSupplierComponent } from './update-supplier/update-supplier.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    DatePipe,
    RouterOutlet,
    FilterComponent,
    PaginationComponent,
    CreateSupplierComponent,
    UpdateSupplierComponent,
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersComponent {
  private readonly supplierService = inject(SupplierService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginatedResultOfShowSupplierDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowSupplierDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Fornecedores');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.supplierService.apiSupplierGet(
      this.filterText(),
      undefined,
      undefined,
      undefined,
      this.currentPage() as any,
      this.pageSize() as any,
    ).subscribe({
      next: result => {
        this.items.set(result);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de fornecedores.');
      },
    });
  }

  protected navigateToDetail(id: string | undefined): void {
    if (!id) return;
    this.router.navigate(['details', id], { relativeTo: this.route });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }

  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowSupplierDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowSupplierDTO): void {
    if (!confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.')) return;
    this.supplierService.apiSupplierIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Fornecedor Excluído', 'O fornecedor foi excluído com sucesso.');
        this.load();
      },
      error: () => {
        this.notificationService.showError('Erro ao Excluir', 'Não foi possível excluir o fornecedor. Tente novamente.');
      },
    });
  }

  protected supplierName(item: ShowSupplierDTO): string {
    if (item.individualPerson) {
      return `${item.individualPerson.firstName ?? ''} ${item.individualPerson.lastName ?? ''}`.trim() || 'Sem nome';
    }
    if (item.companyPerson) {
      return item.companyPerson.name || 'Sem nome';
    }
    return 'Fornecedor';
  }

  protected supplierDocument(item: ShowSupplierDTO): string {
    return item.individualPerson?.cpf ?? item.companyPerson?.cnpj ?? '—';
  }

  protected supplierIcon(item: ShowSupplierDTO): string {
    return item.companyPerson ? 'bi-building' : 'bi-person';
  }
}
