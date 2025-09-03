import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { GraduationRequirementsService, BeltService, ShowBeltDTO } from '../../../../generated_services';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateGraduationRequirementsDTO } from '../../../../generated_services/model/createGraduationRequirementsDTO';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-graduation-requirement',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-graduation-requirement.component.html',
  styleUrl: './create-graduation-requirement.component.scss'
})
export class CreateGraduationRequirementComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() graduationRequirementCreated = new EventEmitter<void>();
  graduationRequirementForm!: FormGroup;
  belts: ShowBeltDTO[] = [];

  constructor(
    private graduationRequirementsService: GraduationRequirementsService,
    private beltService: BeltService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.graduationRequirementForm = this.formBuilder.group({
      beltId: ["", Validators.required],
      description: ["", Validators.required],
      minimumClasses: [0, [Validators.min(0)]],
    })
  }

  ngOnInit(): void {
    this.beltService.apiBeltGet().subscribe(
      {
        next: (result) => {
          this.belts = result;
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Carregar Faixas!', 
            'Não foi possível carregar a lista de faixas. Tente novamente.'
          );
        }
      }
    )
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.graduationRequirementForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    this.graduationRequirementsService.apiGraduationRequirementsPost(this.formToCreateGraduationRequirement()).subscribe(
      {
        next: result => {
          this.notificationService.showSuccess(
            'Requisito de Graduação Criado!', 
            'O requisito de graduação foi criado com sucesso.'
          );
          this.graduationRequirementCreated.emit();
          this.close();
        },
        error: error => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Criar Requisito!', 
            'Não foi possível criar o requisito de graduação. Tente novamente.'
          );
        }
      })
  }

  formToCreateGraduationRequirement(): CreateGraduationRequirementsDTO {
    const formValue = this.graduationRequirementForm.value;
    return {
      beltId: formValue.beltId,
      description: formValue.description,
      minimumClasses: formValue.minimumClasses || 0,
    } as CreateGraduationRequirementsDTO
  }
}
