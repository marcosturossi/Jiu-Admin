import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TransactionCategoryService, ShowTransactionCategoryDTO, UpdateTransactionCategoryDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-transaction-category',
  standalone: true,
  imports: [ReactiveFormsModule],
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
    this.service.apiTransactionCategoryIdPut(this.category().id!, dto).subscribe({
      next: () => { this.ns.showSuccess('Atualizado!', 'Categoria atualizada com sucesso.'); this.categoryUpdated.emit(); },
      error: () => { this.ns.showError('Erro ao Atualizar!', 'Não foi possível atualizar a categoria.'); }
    });
  }
}
