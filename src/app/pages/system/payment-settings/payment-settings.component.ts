import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantSettingsService } from '../../../generated_services/api/tenantSettings.service';
import { PaymentGatewayProvider } from '../../../generated_services/model/paymentGatewayProvider';
import { AsaasEnvironment } from '../../../generated_services/model/asaasEnvironment';
import { UpsertTenantSettingsDto } from '../../../generated_services/model/upsertTenantSettingsDto';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
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
  protected readonly showApiKey = signal(false);

  protected readonly paymentGateways = [
    { label: 'Nenhum', value: PaymentGatewayProvider.None },
    { label: 'Asaas', value: PaymentGatewayProvider.Asaas },
  ];

  protected readonly asaasEnvironments = [
    { label: 'Sandbox (testes)', value: AsaasEnvironment.Sandbox },
    { label: 'Produção', value: AsaasEnvironment.Production },
  ];

  protected readonly form = this.fb.group({
    paymentGateway: [PaymentGatewayProvider.None as string, Validators.required],
    asaasApiKey: [''],
    asaasEnvironment: [AsaasEnvironment.Sandbox as string, Validators.required],
  });

  ngOnInit(): void {
    this.subnavService.setTitle('Configurações de Pagamento');
    this.updateAsaasKeyValidator(this.form.value.paymentGateway ?? PaymentGatewayProvider.None);
    this.form.get('paymentGateway')?.valueChanges.subscribe(value => this.updateAsaasKeyValidator(value));
    this.load();
  }

  private updateAsaasKeyValidator(paymentGateway: string | null | undefined): void {
    const control = this.form.get('asaasApiKey');
    if (paymentGateway === PaymentGatewayProvider.Asaas) {
      control?.setValidators([Validators.required]);
    } else {
      control?.clearValidators();
    }
    control?.updateValueAndValidity();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.tenantSettingsService.apiSettingsGet().subscribe({
      next: (settings) => {
        this.form.patchValue({
          paymentGateway: settings.paymentGateway ?? PaymentGatewayProvider.None,
          asaasApiKey: settings.asaasApiKey ?? '',
          asaasEnvironment: settings.asaasEnvironment ?? AsaasEnvironment.Sandbox,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro de Carregamento', extractErrorMessage(err, 'Não foi possível carregar as configurações de pagamento.'));
      },
    });
  }

  protected toggleApiKeyVisibility(): void {
    this.showApiKey.update(v => !v);
  }

  protected isAsaasSelected(): boolean {
    return this.form.value.paymentGateway === PaymentGatewayProvider.Asaas;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.tenantSettingsService.apiSettingsPut(this.toDTO()).subscribe({
      next: (settings) => {
        this.isSaving.set(false);
        this.form.patchValue({ asaasApiKey: settings.asaasApiKey ?? '' });
        this.notificationService.showSuccess('Configurações Salvas!', 'As configurações de pagamento foram atualizadas com sucesso.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Salvar', extractErrorMessage(err, 'Não foi possível salvar as configurações de pagamento. Tente novamente.'));
      },
    });
  }

  private toDTO(): UpsertTenantSettingsDto {
    const v = this.form.value;
    return {
      paymentGateway: v.paymentGateway as PaymentGatewayProvider,
      asaasApiKey: v.asaasApiKey || null,
      asaasEnvironment: v.asaasEnvironment as AsaasEnvironment,
    };
  }
}
