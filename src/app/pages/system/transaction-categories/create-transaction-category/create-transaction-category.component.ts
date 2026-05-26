import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TransactionCategoryService, CreateTransactionCategoryDTO as CreateTransactionCategoryDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-transaction-category',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const dto: CreateTransactionCategoryDTO = { name: this.form.value.name! };
    this.service.apiTransactionCategoryPost(dto).subscribe({
      next: () => { this.ns.showSuccess('Criado!', 'Categoria criada com sucesso.'); this.categoryCreated.emit(); },
      error: () => { this.ns.showError('Erro ao Criar!', 'Não foi possível criar a categoria.'); }
    });
  }
}
