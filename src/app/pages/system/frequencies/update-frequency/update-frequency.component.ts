import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FrequencyService, StudentsService, ShowStudentDTO, PaginationStudentDTO } from '../../../../generated_services';
import { ShowFrequencyDTO, UpdateFrequencyDTO } from '../../../../generated_services';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-frequency',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-frequency.component.html',
  styleUrl: './update-frequency.component.scss'
})
export class UpdateFrequencyComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() frequencyUpdated = new EventEmitter<void>();
  @Input() frequency!: ShowFrequencyDTO;
  frequencyForm!: FormGroup;
  students!: PaginationStudentDTO;

  constructor(
    private frequencyService: FrequencyService,
    private studentsService: StudentsService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.frequencyForm = this.formBuilder.group({
      studentId: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.studentsService.apiStudentsGet().subscribe(
      {
        next: (result) => {
          this.students = result;
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Carregar Alunos!', 
            'Não foi possível carregar a lista de alunos. Tente novamente.'
          );
        }
      }
    );
    
    this.frequencyForm.patchValue({
      studentId: this.frequency.studentId,
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    if (this.frequencyForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, selecione um aluno.'
      );
      return;
    }

    this.frequencyService.apiFrequencyIdPut(this.frequency.id!, this.formToUpdateFrequency()).subscribe(
      {
        next: result => {
          this.notificationService.showSuccess(
            'Frequência Atualizada!', 
            'A frequência foi atualizada com sucesso.'
          );
          this.frequencyUpdated.emit();
          this.close();
        },
        error: error => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Atualizar Frequência!', 
            'Não foi possível atualizar a frequência. Tente novamente.'
          );
        }
      })
  }

  formToUpdateFrequency(): UpdateFrequencyDTO {
    const formValue = this.frequencyForm.value;
    return {
      studentId: formValue.studentId,
    } as UpdateFrequencyDTO
  }
}
