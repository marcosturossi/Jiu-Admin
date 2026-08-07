import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContractTermsTemplateService } from '../../../generated_services/api/contractTermsTemplate.service';
import { ShowContractTermsTemplateDTO } from '../../../generated_services/model/showContractTermsTemplateDTO';
import { CreateContractTermsTemplateComponent } from './create-contract-terms-template/create-contract-terms-template.component';
import { UpdateContractTermsTemplateComponent } from './update-contract-terms-template/update-contract-terms-template.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';
import { BlobViewerComponent } from '../../../shared/blob-viewer/blob-viewer.component';

@Component({
  selector: 'app-contract-terms-templates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FilterComponent,
    PaginationComponent,
    CreateContractTermsTemplateComponent,
    UpdateContractTermsTemplateComponent,
    BlobViewerComponent,
  ],
  templateUrl: './contract-terms-templates.component.html',
  styleUrl: './contract-terms-templates.component.scss',
})
export class ContractTermsTemplatesComponent {
  private readonly contractTermsTemplateService = inject(ContractTermsTemplateService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowContractTermsTemplateDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly openedPreview = signal(false);
  protected readonly selected = signal<ShowContractTermsTemplateDTO | null>(null);
  protected readonly previewing = signal<ShowContractTermsTemplateDTO | null>(null);
  protected readonly previewLoading = signal(false);
  protected readonly previewBlob = signal<Blob | undefined>(undefined);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Modelos de Contrato');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    // Newest first so the "default" template picked by CreateContractUseCase (whichever the
    // tenant created most recently) is always the top row here too.
    this.contractTermsTemplateService.apiContractTermsTemplateGet(this.filterText(), this.currentPage(), this.pageSize(), 'createdat', true).subscribe({
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
        this.notificationService.showError('Erro ao Carregar!', 'Não foi possível carregar os modelos de contrato. Tente novamente.');
      },
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowContractTermsTemplateDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }
  protected openPreview(item: ShowContractTermsTemplateDTO): void {
    if (!item.id) return;
    this.previewing.set(item);
    this.openedPreview.set(true);
    this.previewLoading.set(true);
    this.previewBlob.set(undefined);
    // Renders through the same IContractPdfService pipeline a real contract uses, so the preview
    // always matches exactly what a student would receive — no separate rendering logic to keep
    // in sync between the two.
    this.contractTermsTemplateService.apiContractTermsTemplateIdPreviewGet(
      item.id, 'body', false, { httpHeaderAccept: 'application/pdf' },
    ).subscribe({
      next: (blob: any) => {
        this.previewBlob.set(blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' }));
        this.previewLoading.set(false);
      },
      error: (err) => {
        this.previewLoading.set(false);
        this.notificationService.showError('Erro', extractErrorMessage(err, 'Não foi possível gerar a pré-visualização do contrato.'));
      },
    });
  }

  protected closePreview(): void {
    this.openedPreview.set(false);
    this.previewing.set(null);
    this.previewBlob.set(undefined);
  }

  protected async delete(item: ShowContractTermsTemplateDTO): Promise<void> {
    const ok = await this.confirmService.confirm(`Tem certeza que deseja excluir o modelo "${item.name}"?`);
    if (!ok) return;
    this.contractTermsTemplateService.apiContractTermsTemplateIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Modelo Excluído!', `O modelo "${item.name}" foi excluído com sucesso.`);
        this.load();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir o modelo. Tente novamente.'));
      },
    });
  }
}
