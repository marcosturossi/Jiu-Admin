import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

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
    { label: 'Ativo', value: ContractStatus.Active },
    { label: 'Inativo', value: ContractStatus.Inactive },
    { label: 'Suspenso', value: ContractStatus.Suspended },
    { label: 'Encerrado', value: ContractStatus.Terminated },
    { label: 'Cancelado', value: ContractStatus.Cancelled },
    { label: 'Expirado', value: ContractStatus.Expired },
  ];

  constructor() {
    this.subnavService.setTitle('Contratos');
    this.searchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe(term => {
      this.filterText.set(term);
      this.currentPage.set(1);
      this.load();
    });
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
  protected onSearch(term: string): void { this.searchSubject.next(term); }
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
