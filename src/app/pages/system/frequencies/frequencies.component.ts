import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { FrequencyService, ShowFrequencyDTO as ShowFrequencyDTO } from '../../../generated_services';
import { CreateFrequencyComponent } from './create-frequency/create-frequency.component';
import { UpdateFrequencyComponent } from './update-frequency/update-frequency.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';

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
  private readonly confirmService = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowFrequencyDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowFrequencyDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal('');

  constructor() {
    this.subnavService.setTitle('Frequências');
    this.searchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe(term => {
      this.filterText.set(term);
      this.currentPage.set(1);
      this.load();
    });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.frequencyService.apiFrequencyGet(undefined, undefined, undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
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
        this.ns.showError('Erro ao Carregar Frequências!', 'Não foi possível carregar a lista de frequências. Tente novamente.');
      },
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.searchSubject.next(term); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowFrequencyDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async deleteFrequency(frequency: ShowFrequencyDTO): Promise<void> {
    const ok = await this.confirmService.confirm('Tem certeza que deseja excluir esta frequência?');
    if (!ok) return;
    this.frequencyService.apiFrequencyIdDelete(frequency.id!).subscribe({
      next: () => { this.ns.showSuccess('Frequência Excluída!', 'A frequência foi excluída com sucesso.'); this.load(); },
      error: (err) => { this.ns.showError('Erro ao Excluir Frequência!', extractErrorMessage(err, 'Não foi possível excluir a frequência. Tente novamente.')); }
    });
  }
}
