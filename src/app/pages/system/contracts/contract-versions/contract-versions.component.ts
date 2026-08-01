import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { ShowContractDTO, ShowContractVersionDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

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
  private readonly ns = inject(NotificationService);

  readonly contract = input.required<ShowContractDTO>();
  readonly closeEvent = output<void>();

  protected readonly isLoading = signal(false);
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
}
