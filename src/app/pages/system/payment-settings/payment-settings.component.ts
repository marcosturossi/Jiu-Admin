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
  protected readonly showWebhookSecret = signal(false);

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
    webhookSecret: [''],
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
          webhookSecret: settings.webhookSecret ?? '',
          asaasEnvironment: settings.asaasEnvironment ?? AsaasEnvironment.Sandbox,
        });
        // Only fields the user actually edits after this point should be sent on save —
        // the API treats an untouched field as "leave as-is", since asaasApiKey/webhookSecret
        // come back masked and must never be echoed back as if they were real values.
        this.form.markAsPristine();
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

  protected toggleWebhookSecretVisibility(): void {
    this.showWebhookSecret.update(v => !v);
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
    this.tenantSettingsService.apiSettingsPatch(this.toDTO()).subscribe({
      next: (settings) => {
        this.isSaving.set(false);
        this.form.patchValue({ asaasApiKey: settings.asaasApiKey ?? '', webhookSecret: settings.webhookSecret ?? '' });
        this.form.markAsPristine();
        this.notificationService.showSuccess('Configurações Salvas!', 'As configurações de pagamento foram atualizadas com sucesso.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Salvar', extractErrorMessage(err, 'Não foi possível salvar as configurações de pagamento. Tente novamente.'));
      },
    });
  }

  /** Untouched fields are sent as `null`, which the API treats as "leave unchanged" — required so
   *  the masked placeholders shown for asaasApiKey/webhookSecret are never echoed back as real values. */
  private toDTO(): UpsertTenantSettingsDto {
    const v = this.form.value;
    const paymentGatewayControl = this.form.get('paymentGateway');
    const asaasApiKeyControl = this.form.get('asaasApiKey');
    const webhookSecretControl = this.form.get('webhookSecret');
    const asaasEnvironmentControl = this.form.get('asaasEnvironment');
    return {
      paymentGateway: paymentGatewayControl?.dirty ? (v.paymentGateway as PaymentGatewayProvider) : null,
      asaasApiKey: asaasApiKeyControl?.dirty ? (v.asaasApiKey || null) : null,
      webhookSecret: webhookSecretControl?.dirty ? (v.webhookSecret || null) : null,
      asaasEnvironment: asaasEnvironmentControl?.dirty ? (v.asaasEnvironment as AsaasEnvironment) : null,
    };
  }
}
