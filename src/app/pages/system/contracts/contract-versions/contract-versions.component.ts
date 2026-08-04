import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { ShowContractDTO, ShowContractVersionDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { environment } from '../../../../enviroments/environment';

@Component({
  selector: 'app-contract-versions',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './contract-versions.component.html',
  styleUrl: './contract-versions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractVersionsComponent {
  private readonly contractService = inject(ContractService);
  private readonly http = inject(HttpClient);
  private readonly ns = inject(NotificationService);

  readonly contract = input.required<ShowContractDTO>();
  readonly closeEvent = output<void>();

  protected readonly isLoading = signal(false);
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly versions = signal<ShowContractVersionDTO[]>([]);

  constructor() {
    effect(() => {
      const id = this.contract().id;
      if (!id) return;
      this.isLoading.set(true);
      this.contractService.apiContractIdVersionsGet(id).subscribe({
        next: (result) => { this.versions.set(result ?? []); this.isLoading.set(false); },
        error: (err) => {
          this.isLoading.set(false);
          this.ns.showError('Erro', extractErrorMessage(err, 'Não foi possível carregar o histórico de versões.'));
        },
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected downloadPdf(version: ShowContractVersionDTO): void {
    if (!version.id) return;
    this.downloadingVersionId.set(version.id);

    const url = `${environment.server}/api/contract/versions/${version.id}/document`;
    this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({ Accept: 'application/pdf' }),
    }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `contrato-${version.id}.pdf`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        this.ns.showError('Erro', extractErrorMessage(err, 'Não foi possível baixar o contrato.'));
        this.downloadingVersionId.set(null);
      },
      complete: () => {
        this.downloadingVersionId.set(null);
      },
    });
  }
}
