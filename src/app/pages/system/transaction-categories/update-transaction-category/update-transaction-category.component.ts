import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TransactionCategoryService, ShowTransactionCategoryDTO as ShowTransactionCategoryDTO, UpdateTransactionCategoryDTO as UpdateTransactionCategoryDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-update-transaction-category',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './update-transaction-category.component.html',
  styleUrl: './update-transaction-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateTransactionCategoryComponent {
  readonly closeEvent = output<void>();
  readonly categoryUpdated = output<void>();
  readonly category = input.required<ShowTransactionCategoryDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TransactionCategoryService);
  private readonly ns = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    isActive: [true],
  });

  protected readonly isSaving = signal(false);

  constructor() {
    effect(() => {
      const c = this.category();
      this.form.patchValue({
        name: c.name ?? '',
        isActive: c.isActive ?? true,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const v = this.form.value;
    const dto: UpdateTransactionCategoryDTO = {
      name: v.name!,
      isActive: v.isActive ?? true,
    };
    this.isSaving.set(true);
    this.service.apiTransactionCategoryIdPut(this.category().id!, dto).subscribe({
      next: () => { this.isSaving.set(false); this.ns.showSuccess('Atualizado!', 'Categoria atualizada com sucesso.'); this.categoryUpdated.emit(); },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Erro ao Atualizar!', extractErrorMessage(err, 'Não foi possível atualizar a categoria.')); }
    });
  }
}
