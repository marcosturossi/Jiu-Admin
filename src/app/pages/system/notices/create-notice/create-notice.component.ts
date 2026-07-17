import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { CreateNoticeDto } from '../../../../generated_services/model/createNoticeDto';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-notice',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './create-notice.component.html',
  styleUrl: './create-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateNoticeComponent {
  readonly closeEvent = output<void>();
  readonly noticeCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly noticesService = inject(NoticesService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    description: ['', Validators.required],
    isActive: [true],
  });

  protected readonly isSaving = signal(false);

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha a descrição do aviso.');
      return;
    }
    this.isSaving.set(true);
    this.noticesService.apiNoticesPost(this.toDTO()).subscribe({
      next: () => { this.isSaving.set(false); this.notificationService.showSuccess('Aviso Criado!', 'O aviso foi criado com sucesso.'); this.noticeCreated.emit(); },
      error: (err) => { this.isSaving.set(false); this.notificationService.showError('Erro ao Criar Aviso!', extractErrorMessage(err, 'Não foi possível criar o aviso. Tente novamente.')); }
    });
  }

  private toDTO(): CreateNoticeDto {
    const v = this.form.value;
    return {
      description: v.description!,
      isActive: v.isActive ?? true,
    } as CreateNoticeDto;
  }
}
