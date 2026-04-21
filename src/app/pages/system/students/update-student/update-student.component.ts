import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, UpdateStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-student',
  imports: [ReactiveFormsModule],
  templateUrl: './update-student.component.html',
  styleUrl: './update-student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateStudentComponent {
  readonly closeEvent = output<void>();
  readonly studentUpdated = output<void>();
  readonly student = input.required<ShowStudentDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    firstName: [''],
    lastName: [''],
    birthDay: [null as Date | null],
    isActive: [true],
    preferredUsername: [''],
  });

  constructor() {
    effect(() => {
      const s = this.student();
      this.form.patchValue({
        userName: s.userName,
        email: s.email,
        phoneNumber: s.phoneNumber ?? '',
        firstName: s.firstName ?? '',
        lastName: s.lastName ?? '',
        birthDay: s.birthDay ? new Date(s.birthDay) : null,
        isActive: s.isActive,
        preferredUsername: s.preferredUsername ?? '',
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const s = this.student();
    this.studentsService.apiStudentsIdPut(s.id!, this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Aluno Atualizado!', `Os dados do aluno ${s.firstName} ${s.lastName} foram atualizados com sucesso.`); this.studentUpdated.emit(); },
      error: () => { this.notificationService.showError('Erro ao Atualizar!', 'Não foi possível atualizar os dados do aluno. Tente novamente.'); }
    });
  }

  private toDTO(): UpdateStudentDTO {
    const v = this.form.value;
    return {
      userName: v.userName!,
      email: v.email!,
      phoneNumber: v.phoneNumber || null,
      firstName: v.firstName || null,
      lastName: v.lastName || null,
      birthDay: v.birthDay instanceof Date ? v.birthDay.toISOString().split('T')[0] : (v.birthDay ?? null),
      isActive: v.isActive ?? true,
      preferredUsername: v.preferredUsername || null,
    } as UpdateStudentDTO;
  }
}
