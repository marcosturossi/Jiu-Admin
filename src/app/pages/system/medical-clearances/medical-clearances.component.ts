import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { ShowMedicalClearanceDTO } from '../../../generated_services/model/showMedicalClearanceDTO';
import { CreateMedicalClearanceComponent } from './create-medical-clearance/create-medical-clearance.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { BlobViewerComponent } from '../../../shared/blob-viewer/blob-viewer.component';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { ODataPage, buildClientPage, parseODataPage } from '../../../utils/odata.utils';

@Component({
  selector: 'app-medical-clearances',
  imports: [DatePipe, CreateMedicalClearanceComponent, PaginationComponent, BlobViewerComponent, FilterComponent],
  templateUrl: './medical-clearances.component.html',
  styleUrl: './medical-clearances.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalClearancesComponent {
  private readonly medicalClearanceService = inject(MedicalClearanceService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowMedicalClearanceDTO> | null>(null);
  protected readonly allItems = signal<ShowMedicalClearanceDTO[]>([]);
  protected readonly openedCreate = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterQuery = signal<string | undefined>(undefined);
  protected readonly attachmentBlob = signal<Blob | undefined>(undefined);
  protected readonly attachmentMimeType = signal<string | undefined>(undefined);
  protected readonly attachmentDialogVisible = signal(false);

  constructor() {
    this.subnavService.setTitle('Atestados Médicos');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const filter = this.filterQuery();
    this.medicalClearanceService.apiMedicalClearanceGet(filter, undefined, '200', '0', 'true').subscribe({
      next: (body: any) => {
        const page = parseODataPage<ShowMedicalClearanceDTO>(body, 200);
        this.allItems.set(page.items);
        this.refreshPage();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro de Carregamento', 'Não foi possível carregar a lista de atestados médicos.'); }
    });
  }

  protected onFilterChange(output: FilterOutput): void { this.filterQuery.set(output.odataFilter); this.currentPage.set(1); this.load(); }

  private refreshPage(): void {
    const page = buildClientPage(this.allItems(), this.currentPage(), this.pageSize());
    this.currentPage.set(page.currentPage);
    this.items.set(page);
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.refreshPage(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.refreshPage(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }

  protected deleteMedicalClearance(clearance: ShowMedicalClearanceDTO): void {
    if (!confirm('Tem certeza que deseja excluir este atestado médico?')) return;
    this.medicalClearanceService.apiMedicalClearanceIdDelete(clearance.id!).subscribe({
      next: () => { this.ns.showSuccess('Atestado Excluído!', 'O atestado médico foi excluído com sucesso.'); this.load(); },
      error: () => this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir o atestado médico. Tente novamente.')
    });
  }

  protected openAttachment(clearance: ShowMedicalClearanceDTO): void {
    if (!clearance.id) return;
    this.isLoading.set(true);
    this.medicalClearanceService.apiMedicalClearanceIdAttachmentGet(
      clearance.id, 'body', false, { httpHeaderAccept: 'application/octet-stream' }
    ).subscribe({
      next: (blob: Blob) => {
        const mime = clearance.attachmentContentType || 'application/pdf';
        this.attachmentBlob.set(blob.type === mime ? blob : new Blob([blob], { type: mime }));
        this.attachmentMimeType.set(mime);
        this.attachmentDialogVisible.set(true);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro ao carregar arquivo', 'Não foi possível carregar o arquivo do atestado.'); }
    });
  }

  protected closeAttachmentViewer(): void {
    this.attachmentDialogVisible.set(false);
    this.attachmentBlob.set(undefined);
    this.attachmentMimeType.set(undefined);
  }

  protected getStatusSeverity(clearance: ShowMedicalClearanceDTO): 'warn' | 'success' | 'danger' | 'secondary' | 'info' {
    if (clearance.isExpired) return 'danger';
    if (clearance.isExpiringSoon) return 'warn';
    return 'success';
  }

  protected getStatusLabel(clearance: ShowMedicalClearanceDTO): string {
    if (clearance.isExpired) return 'Expirado';
    if (clearance.isExpiringSoon) return 'Expira em breve';
    return 'Válido';
  }
}
