import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantSettingsService } from '../../../generated_services/api/tenantSettings.service';
import { UpsertTenantSettingsDto } from '../../../generated_services/model/upsertTenantSettingsDto';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

/** Matches the PaymentProviders.Key row seeded on the backend (Backend.Modules.Authentication). */
const ASAAS_PROVIDER_KEY = 'asaas';
const NONE_PROVIDER_VALUE = '';

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

  /** The backend never returns the real API key (write-only, stored as an opaque encrypted
   *  blob) — this just tells the admin a credential is already on file. */
  protected readonly hasCredentialsConfigured = signal(false);

  protected readonly paymentGateways = [
    { label: 'Nenhum', value: NONE_PROVIDER_VALUE },
    { label: 'Asaas', value: ASAAS_PROVIDER_KEY },
  ];

  protected readonly asaasEnvironments = [
    { label: 'Sandbox (testes)', value: 'Sandbox' },
    { label: 'Produção', value: 'Production' },
  ];

  protected readonly form = this.fb.group({
    // No Validators.required here: "Nenhum" (the empty-string sentinel) is itself a valid,
    // selectable choice meaning "no gateway configured" — it must never fail validation.
    paymentGateway: [NONE_PROVIDER_VALUE as string],
    asaasApiKey: [''],
    webhookSecret: [''],
    asaasEnvironment: ['Sandbox' as string, Validators.required],
  });

  ngOnInit(): void {
    this.subnavService.setTitle('Configurações de Pagamento');
    this.updateAsaasKeyValidator(this.form.value.paymentGateway ?? NONE_PROVIDER_VALUE);
    this.form.get('paymentGateway')?.valueChanges.subscribe(value => this.updateAsaasKeyValidator(value));
    this.load();
  }

  private updateAsaasKeyValidator(paymentGateway: string | null | undefined): void {
    const control = this.form.get('asaasApiKey');
    if (paymentGateway === ASAAS_PROVIDER_KEY) {
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
        this.hasCredentialsConfigured.set(settings.hasCredentialsConfigured ?? false);
        this.form.patchValue({
          paymentGateway: settings.paymentGateway ?? NONE_PROVIDER_VALUE,
          webhookSecret: settings.webhookSecret ?? '',
        });
        // Only fields the user actually edits after this point should be sent on save — the API
        // treats an untouched field as "leave as-is", since webhookSecret comes back masked and
        // must never be echoed back as if it were a real value.
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
    return this.form.value.paymentGateway === ASAAS_PROVIDER_KEY;
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
        this.hasCredentialsConfigured.set(settings.hasCredentialsConfigured ?? false);
        this.form.patchValue({ asaasApiKey: '', webhookSecret: settings.webhookSecret ?? '' });
        this.form.markAsPristine();
        this.notificationService.showSuccess('Configurações Salvas!', 'As configurações de pagamento foram atualizadas com sucesso.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Salvar', extractErrorMessage(err, 'Não foi possível salvar as configurações de pagamento. Tente novamente.'));
      },
    });
  }

  /** Untouched top-level fields are sent as `null`, which the API treats as "leave unchanged".
   *
   *  Credentials work differently: the backend stores them as a single opaque JSON blob and
   *  fully REPLACES it on every write — it can't merge in just the one key the admin changed.
   *  Sending `{ environment: "Production" }` alone would wipe out the previously stored API key.
   *  Since apiKey is required whenever Asaas is selected (see updateAsaasKeyValidator), it's safe
   *  to always resend the whole credentials object together rather than tracking dirtiness per
   *  sub-field — the validator already guarantees a real value is present at submit time. */
  private toDTO(): UpsertTenantSettingsDto {
    const v = this.form.value;
    const paymentGatewayControl = this.form.get('paymentGateway');
    const webhookSecretControl = this.form.get('webhookSecret');

    const credentials = this.isAsaasSelected()
      ? { apiKey: (v.asaasApiKey ?? '').trim(), environment: v.asaasEnvironment ?? 'Sandbox' }
      // The generated type doesn't reflect that Credentials is nullable server-side (leaving it
      // untouched when no gateway is selected) — cast needed to send a real `null` over the wire.
      : (null as unknown as { [key: string]: string });

    return {
      paymentGateway: paymentGatewayControl?.dirty ? (v.paymentGateway || null) : null,
      credentials,
      webhookSecret: webhookSecretControl?.dirty ? (v.webhookSecret || null) : null,
    };
  }
}
