import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { ShowNoticeDto } from '../../../../generated_services/model/showNoticeDto';
import { UpdateNoticeDto } from '../../../../generated_services/model/updateNoticeDto';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-notice',
  imports: [ReactiveFormsModule],
  templateUrl: './update-notice.component.html',
  styleUrl: './update-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateNoticeComponent {
  readonly closeEvent = output<void>();
  readonly noticeUpdated = output<void>();
  readonly notice = input.required<ShowNoticeDto>();

  private readonly fb = inject(FormBuilder);
  private readonly noticesService = inject(NoticesService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    description: ['', Validators.required],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const n = this.notice();
      this.form.patchValue({
        description: n.description,
        isActive: n.isActive ?? true,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const n = this.notice();
    this.noticesService.apiNoticesIdPut(n.id!, this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Aviso Atualizado!', 'O aviso foi atualizado com sucesso.'); this.noticeUpdated.emit(); },
      error: () => { this.notificationService.showError('Erro ao Atualizar Aviso!', 'Não foi possível atualizar o aviso. Tente novamente.'); }
    });
  }

  private toDTO(): UpdateNoticeDto {
    const v = this.form.value;
    return {
      description: v.description!,
      isActive: v.isActive ?? true,
    } as UpdateNoticeDto;
  }
}
