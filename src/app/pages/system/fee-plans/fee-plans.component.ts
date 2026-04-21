import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FeePlanService, PaginationFeePlanDTO, ShowFeePlanDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateFeePlanComponent } from './create-fee-plan/create-fee-plan.component';
import { UpdateFeePlanComponent } from './update-fee-plan/update-fee-plan.component';

@Component({
  selector: 'app-fee-plans',
  standalone: true,
  imports: [
    CurrencyPipe,
    PaginationComponent,
    CreateFeePlanComponent,
    UpdateFeePlanComponent,
  ],
  templateUrl: './fee-plans.component.html',
  styleUrl: './fee-plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeePlansComponent {
  private readonly service = inject(FeePlanService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginationFeePlanDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowFeePlanDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  constructor() {
    this.subnavService.setTitle('Planos de Mensalidade');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.service.apiFeePlanGet(undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro', 'Não foi possível carregar.'); }
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowFeePlanDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowFeePlanDTO): void {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    this.service.apiFeePlanIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Excluído!', 'Plano excluído com sucesso.'); this.load(); },
      error: () => { this.notificationService.showError('Erro ao Excluir!', 'Não foi possível excluir o plano.'); }
    });
  }
}
