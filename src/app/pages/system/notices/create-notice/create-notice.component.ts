import { Component, Output, EventEmitter } from '@angular/core';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateNoticesDTO } from '../../../../generated_services/model/createNoticesDTO';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-notice',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-notice.component.html',
  styleUrl: './create-notice.component.scss'
})
export class CreateNoticeComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() noticeCreated = new EventEmitter<void>();
  noticeForm!: FormGroup;

  constructor(
    private noticesService: NoticesService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.noticeForm = this.formBuilder.group({
      description: ["", Validators.required],
      isActive: [true],
    })
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.noticeForm.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha a descrição do aviso.');
      return;
    }

    this.noticesService.apiNoticesPost(this.formToCreateNotice()).subscribe({
      next: result => {
        this.notificationService.showSuccess('Aviso Criado!', 'O aviso foi criado com sucesso.');
        this.noticeCreated.emit();
        this.close();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError('Erro ao Criar Aviso!', 'Não foi possível criar o aviso. Tente novamente.');
      }
    });
  }

  formToCreateNotice(): CreateNoticesDTO {
    const formValue = this.noticeForm.value;
    return {
      description: formValue.description,
      isActive: formValue.isActive,
    } as CreateNoticesDTO
  }
}
