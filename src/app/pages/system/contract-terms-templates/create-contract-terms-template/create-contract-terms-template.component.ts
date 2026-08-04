import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { ContractTermsTemplateService } from '../../../../generated_services/api/contractTermsTemplate.service';
import { CreateContractTermsTemplateDTO } from '../../../../generated_services/model/createContractTermsTemplateDTO';
import { ShowContractTermsTemplateDTO } from '../../../../generated_services/model/showContractTermsTemplateDTO';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { CONTRACT_TERMS_QUILL_MODULES } from '../quill-config';

@Component({
  selector: 'app-create-contract-terms-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QuillEditorComponent, FieldErrorComponent],
  templateUrl: './create-contract-terms-template.component.html',
  styleUrl: './create-contract-terms-template.component.scss',
})
export class CreateContractTermsTemplateComponent {
  readonly closeEvent = output<void>();
  readonly templateCreated = output<ShowContractTermsTemplateDTO>();

  private readonly contractTermsTemplateService = inject(ContractTermsTemplateService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly quillModules = CONTRACT_TERMS_QUILL_MODULES;
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    text: ['', Validators.required],
  });

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.contractTermsTemplateService.apiContractTermsTemplatePost(this.toDTO()).subscribe({
      next: (template) => {
        this.isSaving.set(false);
        this.ns.showSuccess('Modelo Criado!', `O modelo "${this.form.value.name}" foi criado com sucesso.`);
        this.templateCreated.emit(template);
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.ns.showError('Erro ao Criar Modelo!', extractErrorMessage(err, 'Não foi possível criar o modelo. Tente novamente.'));
      },
    });
  }

  private toDTO(): CreateContractTermsTemplateDTO {
    const v = this.form.getRawValue();
    return {
      name: v.name!,
      text: v.text!,
    } as CreateContractTermsTemplateDTO;
  }
}
