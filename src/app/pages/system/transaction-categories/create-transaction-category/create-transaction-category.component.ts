import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TransactionCategoryService, CreateTransactionCategoryDTO as CreateTransactionCategoryDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-transaction-category',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './create-transaction-category.component.html',
  styleUrl: './create-transaction-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTransactionCategoryComponent {
  readonly closeEvent = output<void>();
  readonly categoryCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TransactionCategoryService);
  private readonly ns = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
  });

  protected readonly isSaving = signal(false);

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const dto: CreateTransactionCategoryDTO = { name: this.form.value.name! };
    this.isSaving.set(true);
    this.service.apiTransactionCategoryPost(dto).subscribe({
      next: () => { this.isSaving.set(false); this.ns.showSuccess('Criado!', 'Categoria criada com sucesso.'); this.categoryCreated.emit(); },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Erro ao Criar!', extractErrorMessage(err, 'Não foi possível criar a categoria.')); }
    });
  }
}
