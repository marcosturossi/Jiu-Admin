import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { ShowAcademyDto } from '../../../../generated_services/model/showAcademyDto';
import { UpsertAcademyPaymentSettingsDto } from '../../../../generated_services/model/upsertAcademyPaymentSettingsDto';
import { NotificationService } from '../../../../services/notification.service';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { extractErrorMessage } from '../../../../utils/error.utils';

const SPLIT_TYPE_PERCENTAGE = 'Percentage';
const SPLIT_TYPE_FIXED_VALUE = 'FixedValue';
/** Matches Backend.Shared.Domain.Enums.BillingType. Empty = no override, use PIX. */
const NONE_BILLING_TYPE = '';

@Component({
  selector: 'app-academy-payment-settings',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './academy-payment-settings.component.html',
  styleUrl: './academy-payment-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademyPaymentSettingsComponent implements OnInit {
  readonly closeEvent = output<void>();
  readonly academy = input.required<ShowAcademyDto>();

  private readonly fb = inject(FormBuilder);
  private readonly academyService = inject(AcademyService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly splitTypes = [
    { label: 'Percentual', value: SPLIT_TYPE_PERCENTAGE },
    { label: 'Valor Fixo', value: SPLIT_TYPE_FIXED_VALUE },
  ];

  protected readonly billingTypes = [
    { label: 'Sem padrão (usa PIX)', value: NONE_BILLING_TYPE },
    { label: 'PIX', value: 'PIX' },
    { label: 'Boleto', value: 'BOLETO' },
    { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
    { label: 'Dinheiro', value: 'MONEY' },
  ];

  protected readonly form = this.fb.group({
    asaasWalletId: ['', Validators.required],
    splitType: [SPLIT_TYPE_PERCENTAGE as string, Validators.required],
    splitPercentualValue: [null as number | null],
    splitFixedValue: [null as number | null],
    defaultBillingType: [NONE_BILLING_TYPE as string],
  });

  ngOnInit(): void {
    this.updateSplitValueValidators(this.form.value.splitType ?? SPLIT_TYPE_PERCENTAGE);
    this.form.get('splitType')?.valueChanges.subscribe(value => this.updateSplitValueValidators(value));
    this.load();
  }

  private updateSplitValueValidators(splitType: string | null | undefined): void {
    const percentualControl = this.form.get('splitPercentualValue');
    const fixedControl = this.form.get('splitFixedValue');
    if (splitType === SPLIT_TYPE_PERCENTAGE) {
      percentualControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      fixedControl?.clearValidators();
    } else {
      fixedControl?.setValidators([Validators.required, Validators.min(0)]);
      percentualControl?.clearValidators();
    }
    percentualControl?.updateValueAndValidity();
    fixedControl?.updateValueAndValidity();
  }

  protected isPercentageSelected(): boolean {
    return this.form.value.splitType === SPLIT_TYPE_PERCENTAGE;
  }

  private load(): void {
    this.isLoading.set(true);
    this.academyService.apiAdminAcademiesIdPaymentSettingsGet(this.academy().id!).subscribe({
      next: (settings) => {
        this.form.patchValue({
          asaasWalletId: settings.asaasWalletId ?? '',
          splitType: settings.splitType ?? SPLIT_TYPE_PERCENTAGE,
          splitPercentualValue: (settings.splitPercentualValue as unknown as number) ?? null,
          splitFixedValue: (settings.splitFixedValue as unknown as number) ?? null,
          defaultBillingType: settings.defaultBillingType ?? NONE_BILLING_TYPE,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro de Carregamento', extractErrorMessage(err, 'Não foi possível carregar as configurações de pagamento da academia.'));
      },
    });
  }

  protected close(): void {
    this.closeEvent.emit();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.academyService.apiAdminAcademiesIdPaymentSettingsPut(this.academy().id!, this.toDTO()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notificationService.showSuccess('Configurações Salvas!', 'As configurações de pagamento da academia foram atualizadas com sucesso.');
        this.closeEvent.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Salvar', extractErrorMessage(err, 'Não foi possível salvar as configurações de pagamento. Tente novamente.'));
      },
    });
  }

  private toDTO(): UpsertAcademyPaymentSettingsDto {
    const v = this.form.value;
    const isPercentage = v.splitType === SPLIT_TYPE_PERCENTAGE;
    return {
      asaasWalletId: v.asaasWalletId!,
      splitType: v.splitType!,
      splitPercentualValue: (isPercentage ? v.splitPercentualValue : null) as any,
      splitFixedValue: (isPercentage ? null : v.splitFixedValue) as any,
      defaultBillingType: v.defaultBillingType || null,
    } as UpsertAcademyPaymentSettingsDto;
  }
}
