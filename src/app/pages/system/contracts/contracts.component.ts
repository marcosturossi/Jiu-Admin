import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContractService } from '../../../generated_services/api/contract.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowContractDTO as ShowContractDTO, ContractStatus as ContractStatus } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateContractComponent } from './create-contract/create-contract.component';
import { UpdateContractComponent } from './update-contract/update-contract.component';
import { PageResult } from '../../../utils/page-result';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    RouterLink,
    FilterComponent,
    PaginationComponent,
    CreateContractComponent,
    UpdateContractComponent,
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractsComponent {
  private readonly contractService = inject(ContractService);
  private readonly studentsService = inject(StudentsService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowContractDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowContractDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterStatus = signal<ContractStatus | undefined>(undefined);
  protected readonly studentMap = signal<Map<string, string>>(new Map());

  protected readonly filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: String(ContractStatus.Active), label: 'Ativo' },
        { value: String(ContractStatus.Inactive), label: 'Inativo' },
        { value: String(ContractStatus.Suspended), label: 'Suspenso' },
        { value: String(ContractStatus.Terminated), label: 'Encerrado' },
        { value: String(ContractStatus.Cancelled), label: 'Cancelado' },
        { value: String(ContractStatus.Expired), label: 'Expirado' },
      ],
    },
  ];

  constructor() {
    this.subnavService.setTitle('Contratos');
    this.load();
    this.studentsService.apiStudentsGet(undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        const map = new Map((result?.items ?? []).map(s => [s.id!, `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()]));
        this.studentMap.set(map);
      },
    });
  }

  protected load(): void {
    this.isLoading.set(true);
    this.contractService.apiContractGet(this.filterStatus() as any, undefined, undefined, undefined, undefined, undefined, undefined, this.currentPage() as any, this.pageSize() as any).subscribe({
      next: result => {
        this.items.set({
          items: result?.items ?? [],
          totalCount: (result?.totalCount as unknown as number) ?? 0,
          totalPages: (result?.totalPages as unknown as number) ?? 1,
        });
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro', 'Não foi possível carregar os contratos.'); }
    });
  }

  protected getStatusSeverity(status?: number | string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case ContractStatus.Active: return 'success';
      case ContractStatus.Inactive:
      case ContractStatus.Expired: return 'secondary';
      case ContractStatus.Suspended: return 'warn';
      case ContractStatus.Terminated: return 'info';
      case ContractStatus.Cancelled: return 'danger';
      default: return 'secondary';
    }
  }

  protected getStatusLabel(status?: number | string): string {
    switch (status) {
      case ContractStatus.Active: return 'Ativo';
      case ContractStatus.Inactive: return 'Inativo';
      case ContractStatus.Suspended: return 'Suspenso';
      case ContractStatus.Terminated: return 'Encerrado';
      case ContractStatus.Cancelled: return 'Cancelado';
      case ContractStatus.Expired: return 'Expirado';
      default: return '—';
    }
  }

  protected getStudentName(id?: string): string {
    return id ? (this.studentMap().get(id) ?? id) : '—';
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void {
    this.filterStatus.set(output.conditions.find(c => c.field.key === 'status')?.value as ContractStatus | undefined);
    this.currentPage.set(1);
    this.load();
  }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowContractDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async delete(item: ShowContractDTO): Promise<void> {
    const ok = await this.confirmService.confirm('Tem certeza que deseja excluir este contrato?');
    if (!ok) return;
    this.contractService.apiContractIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Contrato Excluído!', 'Excluído com sucesso.'); this.load(); },
      error: (err) => { this.ns.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir.')); },
    });
  }
}
