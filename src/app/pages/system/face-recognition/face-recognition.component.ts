import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PersonsService } from '../../../generated_services/api2/api/persons.service';
import { PersonDetailResponse } from '../../../generated_services/api2/model/personDetailResponse';
import { PersonListResponse } from '../../../generated_services/api2/model/personListResponse';
import { CreatePersonsComponent } from './create-persons/create-persons.component';
import { UpdatePersonsComponent } from './update-persons/update-persons.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-face-recognition',
  templateUrl: './face-recognition.component.html',
  styleUrl: './face-recognition.component.scss',
  standalone: true,
  imports: [FilterComponent, CreatePersonsComponent, UpdatePersonsComponent, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaceRecognitionComponent {
  private readonly personsService = inject(PersonsService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly persons = signal<PersonDetailResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<PersonDetailResponse | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Reconhecimento Facial');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.personsService.listPersonsApiV1PersonsGet(this.currentPage(), this.pageSize(), this.filterText()).subscribe({
      next: (result: PersonListResponse) => {
        this.persons.set(result.persons || []);
        this.totalItems.set(result.total ?? this.persons().length);
        const ps = result.page_size ?? this.pageSize();
        this.pageSize.set(ps);
        this.currentPage.set(result.page ?? this.currentPage());
        this.totalPages.set(Math.max(1, Math.ceil(this.totalItems() / ps)));
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro', 'Erro ao carregar pessoas.'); }
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected onPersonCreated(): void { this.openedCreate.set(false); this.load(); }
  protected openEdit(person: PersonDetailResponse): void { this.selected.set(person); this.openedUpdate.set(true); }
  protected onPersonUpdated(updated: PersonDetailResponse): void { this.openedUpdate.set(false); this.selected.set(null); this.load(); }

  protected async deletePerson(person: PersonDetailResponse): Promise<void> {
    const ok = await this.confirmService.confirm(`Tem certeza que deseja excluir a pessoa "${person.name}"?`);
    if (!ok) return;
    this.personsService.deletePersonApiV1PersonsPersonIdDelete(person.id).subscribe({
      next: () => { this.ns.showSuccess('Pessoa Excluída!', `A pessoa "${person.name}" foi excluída com sucesso.`); this.load(); },
      error: (err) => this.ns.showError('Erro ao Excluir', extractErrorMessage(err, 'Não foi possível excluir a pessoa.'))
    });
  }

  protected getImageSrc(img: any): string {
    if (!img?.base64) return '';
    let base64 = img.base64.trim();
    if (base64.startsWith('data:image')) return base64;
    if (base64.includes('base64,')) base64 = base64.split('base64,')[1];
    return `data:image/png;base64,${base64}`;
  }

  protected getTotalImages(): number {
    return this.persons().reduce((t, p) => t + (p.images?.length || 0), 0);
  }

  protected getPersonsWithImages(): number {
    return this.persons().filter(p => p.images && p.images.length > 0).length;
  }
}
