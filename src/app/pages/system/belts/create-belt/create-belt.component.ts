import { Component, Output, EventEmitter } from '@angular/core';
import { BeltService } from '../../../../generated_services';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateBeltDTO } from '../../../../generated_services/model/createBeltDTO';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-belt',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-belt.component.html',
  styleUrl: './create-belt.component.scss'
})
export class CreateBeltComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() beltCreated = new EventEmitter<void>();
  beltForm!: FormGroup;

  constructor(
    private beltService: BeltService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.beltForm = this.formBuilder.group({
      color: ["", Validators.required],
      orderIndex: [0, [Validators.required, Validators.min(0)]],
      isForKids: [false],
    })
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.beltForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    this.beltService.apiBeltPost(this.formToCreateBelt()).subscribe({
      next: result => {
        this.notificationService.showSuccess(
          'Faixa Criada!', 
          'A nova faixa foi criada com sucesso.'
        );
        this.beltCreated.emit();
        this.close();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError(
          'Erro ao Criar Faixa!', 
          'Não foi possível criar a faixa. Tente novamente.'
        );
      }
    });
  }

  formToCreateBelt(): CreateBeltDTO {
    const formValue = this.beltForm.value;
    return {
      color: formValue.color,
      orderIndex: formValue.orderIndex,
      isForKids: formValue.isForKids,
    } as CreateBeltDTO
  }
}
