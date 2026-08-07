import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { ContractTermsTemplateService } from '../../../../generated_services/api/contractTermsTemplate.service';
import { ShowContractTermsTemplateDTO } from '../../../../generated_services/model/showContractTermsTemplateDTO';
import { UpdateContractTermsTemplateDTO } from '../../../../generated_services/model/updateContractTermsTemplateDTO';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { CONTRACT_TERMS_QUILL_FORMATS, CONTRACT_TERMS_QUILL_MODULES } from '../quill-config';

@Component({
  selector: 'app-update-contract-terms-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QuillEditorComponent, FieldErrorComponent],
  templateUrl: './update-contract-terms-template.component.html',
  styleUrl: './update-contract-terms-template.component.scss',
})
export class UpdateContractTermsTemplateComponent {
  readonly closeEvent = output<void>();
  readonly templateUpdated = output<void>();
  readonly template = input.required<ShowContractTermsTemplateDTO>();

  private readonly contractTermsTemplateService = inject(ContractTermsTemplateService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly quillModules = CONTRACT_TERMS_QUILL_MODULES;
  protected readonly quillFormats = CONTRACT_TERMS_QUILL_FORMATS;
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    text: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const t = this.template();
      this.form.patchValue({
        name: t.name,
        text: t.text,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.contractTermsTemplateService.apiContractTermsTemplateIdPut(this.template().id!, this.toDTO()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.ns.showSuccess('Modelo Atualizado!', `O modelo "${this.form.value.name}" foi atualizado com sucesso.`);
        this.templateUpdated.emit();
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.ns.showError('Erro ao Atualizar Modelo!', extractErrorMessage(err, 'Não foi possível atualizar o modelo. Tente novamente.'));
      },
    });
  }

  private toDTO(): UpdateContractTermsTemplateDTO {
    const v = this.form.getRawValue();
    return {
      name: v.name!,
      text: v.text!,
    } as UpdateContractTermsTemplateDTO;
  }
}
