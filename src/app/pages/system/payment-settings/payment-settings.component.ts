import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TenantSettingsService } from '../../../generated_services/api/tenantSettings.service';
import { AuditLogEntryDto } from '../../../generated_services/model/auditLogEntryDto';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { PageResult } from '../../../utils/page-result';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

/** Matches Backend.Shared.Domain.Enums.BillingType. */
const NONE_BILLING_TYPE = '';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, PaginationComponent],
  templateUrl: './payment-settings.component.html',
  styleUrl: './payment-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isLoadingHistory = signal(false);
  protected readonly history = signal<PageResult<AuditLogEntryDto> | null>(null);
  protected readonly expandedEntryId = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly billingTypes = [
    { label: 'Sem padrão (usa PIX)', value: NONE_BILLING_TYPE },
    { label: 'PIX', value: 'PIX' },
    { label: 'Boleto', value: 'BOLETO' },
    { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
    { label: 'Dinheiro', value: 'MONEY' },
  ];

  protected readonly form = this.fb.group({
    defaultBillingType: [NONE_BILLING_TYPE as string],
  });

  ngOnInit(): void {
    this.subnavService.setTitle('Configurações de Cobrança');
    this.load();
    this.loadHistory();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.tenantSettingsService.apiSettingsGet().subscribe({
      next: (settings) => {
        this.form.patchValue({ defaultBillingType: settings.defaultBillingType ?? NONE_BILLING_TYPE });
        this.form.markAsPristine();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro de Carregamento', extractErrorMessage(err, 'Não foi possível carregar as configurações de cobrança.'));
      },
    });
  }

  protected save(): void {
    this.isSaving.set(true);
    const v = this.form.value;
    this.tenantSettingsService.apiSettingsPatch({ defaultBillingType: v.defaultBillingType || null }).subscribe({
      next: (settings) => {
        this.isSaving.set(false);
        this.form.patchValue({ defaultBillingType: settings.defaultBillingType ?? NONE_BILLING_TYPE });
        this.form.markAsPristine();
        this.notificationService.showSuccess('Configurações Salvas!', 'A forma de pagamento padrão foi atualizada com sucesso.');
        this.loadHistory();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Salvar', extractErrorMessage(err, 'Não foi possível salvar as configurações de cobrança. Tente novamente.'));
      },
    });
  }

  protected loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.tenantSettingsService.apiSettingsAuditHistoryGet(this.currentPage(), this.pageSize()).subscribe({
      next: (result) => {
        this.history.set({
          items: result?.items ?? [],
          totalCount: (result?.totalCount as unknown as number) ?? 0,
          totalPages: (result?.totalPages as unknown as number) ?? 1,
        });
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        this.isLoadingHistory.set(false);
        this.notificationService.showError('Erro de Carregamento', extractErrorMessage(err, 'Não foi possível carregar o histórico de alterações.'));
      },
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadHistory();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadHistory();
  }

  protected toggleExpanded(entryId: string): void {
    this.expandedEntryId.set(this.expandedEntryId() === entryId ? null : entryId);
  }
}
