import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CreateStudentDTO } from '../../../../generated_services/model/createStudentDTO';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-student',
  imports: [ReactiveFormsModule],
  templateUrl: './create-student.component.html',
  styleUrl: './create-student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateStudentComponent {
  readonly closeEvent = output<void>();
  readonly studentCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    firstName: [''],
    lastName: [''],
    birthDay: [null as string | null],
    cpf: ['', [Validators.required]],
    isActive: [true],
    preferredUsername: [''],
  });

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.studentsService.apiStudentsPost(this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Sucesso!', 'Aluno criado com sucesso.'); this.studentCreated.emit(); },
      error: () => { this.notificationService.showError('Erro!', 'Erro ao criar aluno. Tente novamente.'); }
    });
  }

  private toDTO(): CreateStudentDTO {
    const v = this.form.value;
    return {
      userName: v.userName!,
      email: v.email!,
      phoneNumber: v.phoneNumber || null,
      firstName: v.firstName || null,
      lastName: v.lastName || null,
      birthDay: v.birthDay ?? null,
      cpf: v.cpf!,
      isActive: v.isActive ?? true,
      preferredUsername: v.preferredUsername || null,
    } as CreateStudentDTO;
  }
}
