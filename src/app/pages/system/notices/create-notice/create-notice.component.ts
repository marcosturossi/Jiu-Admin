import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { CreateNoticesDTO } from '../../../../generated_services/model/createNoticesDTO';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-notice',
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
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

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha a descrição do aviso.');
      return;
    }
    this.noticesService.apiNoticesPost(this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Aviso Criado!', 'O aviso foi criado com sucesso.'); this.noticeCreated.emit(); },
      error: () => { this.notificationService.showError('Erro ao Criar Aviso!', 'Não foi possível criar o aviso. Tente novamente.'); }
    });
  }

  private toDTO(): CreateNoticesDTO {
    const v = this.form.value;
    return {
      description: v.description!,
      isActive: v.isActive ?? true,
    } as CreateNoticesDTO;
  }
}
