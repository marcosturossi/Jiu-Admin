import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../../generated_services/api/contract.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowContractDTO, PaginationContractDTO, ContractStatus } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateContractComponent } from './create-contract/create-contract.component';
import { UpdateContractComponent } from './update-contract/update-contract.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
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
  protected readonly items = signal<PaginationContractDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowContractDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterStatus = signal<ContractStatus | undefined>(undefined);
  protected readonly filterText = signal('');
  protected readonly studentMap = signal<Map<string, string>>(new Map());

  protected readonly statusOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Ativo', value: ContractStatus.NUMBER_0 },
    { label: 'Suspenso', value: ContractStatus.NUMBER_1 },
    { label: 'Cancelado', value: ContractStatus.NUMBER_2 },
    { label: 'Concluído', value: ContractStatus.NUMBER_3 },
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
    this.contractService
      .apiContractGet(
        this.filterText() || undefined,
        undefined,
        undefined,
        this.filterStatus(),
        undefined, undefined,
        this.currentPage(), this.pageSize(),
      )
      .subscribe({
        next: result => { this.items.set(result); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.ns.showError('Erro', 'Não foi possível carregar os contratos.'); },
      });
  }

  protected getStatusSeverity(status?: ContractStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case ContractStatus.NUMBER_0: return 'success';
      case ContractStatus.NUMBER_1: return 'warn';
      case ContractStatus.NUMBER_2: return 'danger';
      case ContractStatus.NUMBER_3: return 'info';
      default: return 'secondary';
    }
  }

  protected getStatusLabel(status?: ContractStatus): string {
    switch (status) {
      case ContractStatus.NUMBER_0: return 'Ativo';
      case ContractStatus.NUMBER_1: return 'Suspenso';
      case ContractStatus.NUMBER_2: return 'Cancelado';
      case ContractStatus.NUMBER_3: return 'Concluído';
      default: return '—';
    }
  }

  protected getStudentName(id?: string): string {
    return id ? (this.studentMap().get(id) ?? id) : '—';
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.filterText.set(term); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowContractDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }
  protected onFilterChange(): void { this.currentPage.set(1); this.load(); }

  protected delete(item: ShowContractDTO): void {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    this.contractService.apiContractIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Contrato Excluído!', 'Excluído com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir.'); },
    });
  }
}
