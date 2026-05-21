import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ContractService } from '../../../generated_services/api/contract.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { CarlonGracieBackendFinancesApplicationDTOsShowContractDTO as ShowContractDTO, CarlonGracieBackendSharedDomainEnumsContractStatus as ContractStatus } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateContractComponent } from './create-contract/create-contract.component';
import { UpdateContractComponent } from './update-contract/update-contract.component';
import { ODataPage, parseODataPage, buildODataFilter } from '../../../utils/odata.utils';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
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

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowContractDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowContractDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterStatus = signal<string | undefined>(undefined);
  protected readonly filterText = signal('');
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
    this.studentsService.apiStudentsActiveGet().subscribe({
      next: students => {
        const map = new Map(students.map(s => [s.id!, `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()]));
        this.studentMap.set(map);
      },
    });
  }

  protected load(): void {
    this.isLoading.set(true);
    const skip = (this.currentPage() - 1) * this.pageSize();
    let filter = buildODataFilter(this.filterText(), ['notes']);
    if (this.filterStatus()) {
      const enumFilter = `status eq '${this.filterStatus()}'`;
      filter = filter ? `${filter} and ${enumFilter}` : enumFilter;
    }
    this.contractService
      .apiContractGet(filter, undefined, String(this.pageSize()), String(skip), 'true')
      .subscribe({
        next: (body: any) => { this.items.set(parseODataPage<ShowContractDTO>(body, this.pageSize())); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.ns.showError('Erro', 'Não foi possível carregar os contratos.'); },
      });
  }

  protected getStatusSeverity(status?: ContractStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
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

  protected getStatusLabel(status?: ContractStatus): string {
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
    this.filterText.set(output.text);
    const statusCond = output.conditions.find(c => c.field.key === 'status');
    this.filterStatus.set(statusCond?.value ?? undefined);
    this.currentPage.set(1);
    this.load();
  }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowContractDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowContractDTO): void {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    this.contractService.apiContractIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Contrato Excluído!', 'Excluído com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir.'); },
    });
  }
}
