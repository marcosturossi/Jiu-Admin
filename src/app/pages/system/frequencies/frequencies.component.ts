import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { FrequencyService, CarlonGracieBackendAttendanceApplicationDTOsShowFrequencyDTO as ShowFrequencyDTO } from '../../../generated_services';
import { CreateFrequencyComponent } from './create-frequency/create-frequency.component';
import { UpdateFrequencyComponent } from './update-frequency/update-frequency.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { ODataPage, buildClientPage, parseODataPage, buildODataFilter } from '../../../utils/odata.utils';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowFrequencyDTO> | null>(null);
  protected readonly allItems = signal<ShowFrequencyDTO[]>([]);
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
    const filter = buildODataFilter(this.filterText(), ['studentName', 'lessonTitle']);
    this.frequencyService.apiFrequencyGet(filter, undefined, '200', '0', 'true').subscribe({
      next: (body: any) => {
        const page = parseODataPage<ShowFrequencyDTO>(body, 200);
        this.allItems.set(page.items);
        this.refreshPage();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro ao Carregar Frequências!', 'Não foi possível carregar a lista de frequências. Tente novamente.'); }
    });
  }

  private refreshPage(): void {
    const page = buildClientPage(this.allItems(), this.currentPage(), this.pageSize());
    this.currentPage.set(page.currentPage);
    this.items.set(page);
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.refreshPage(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.refreshPage(); }
  protected onSearch(term: string): void { this.searchSubject.next(term); }
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
