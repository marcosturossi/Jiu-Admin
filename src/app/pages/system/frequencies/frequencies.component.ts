import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FrequencyService, PaginationFrequencyDTO, ShowFrequencyDTO } from '../../../generated_services';
import { CreateFrequencyComponent } from './create-frequency/create-frequency.component';
import { UpdateFrequencyComponent } from './update-frequency/update-frequency.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-frequencies',
  imports: [CreateFrequencyComponent, UpdateFrequencyComponent, DatePipe, PaginationComponent],
  templateUrl: './frequencies.component.html',
  styleUrl: './frequencies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrequenciesComponent {
  private readonly frequencyService = inject(FrequencyService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginationFrequencyDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowFrequencyDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  constructor() {
    this.subnavService.setTitle('Frequências');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.frequencyService.apiFrequencyGet(undefined, undefined, undefined, undefined, undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: r => { this.items.set(r); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.ns.showError('Erro ao Carregar Frequências!', 'Não foi possível carregar a lista de frequências. Tente novamente.');
      }
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowFrequencyDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected deleteFrequency(frequency: ShowFrequencyDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta frequência?')) return;
    this.frequencyService.apiFrequencyIdDelete(frequency.id!).subscribe({
      next: () => { this.ns.showSuccess('Frequência Excluída!', 'A frequência foi excluída com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir Frequência!', 'Não foi possível excluir a frequência. Tente novamente.'); }
    });
  }
}

