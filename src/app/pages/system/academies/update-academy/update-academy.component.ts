import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { ShowAcademyDTO } from '../../../../generated_services/model/showAcademyDTO';
import { UpdateAcademyDTO } from '../../../../generated_services/model/updateAcademyDTO';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-academy',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-academy.component.html',
  styleUrl: './update-academy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateAcademyComponent {
  readonly closeEvent = output<void>();
  readonly academyUpdated = output<void>();
  readonly academy = input.required<ShowAcademyDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly academyService = inject(AcademyService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const a = this.academy();
      this.form.patchValue({
        name: a.name ?? '',
        isActive: a.isActive ?? true,
      });
    });
  }

  protected close(): void {
    this.closeEvent.emit();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const a = this.academy();
    this.academyService.apiAdminAcademiesIdPut(a.id!, this.toDTO()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Academia Atualizada!', `A academia "${a.name}" foi atualizada com sucesso.`);
        this.academyUpdated.emit();
      },
      error: () => {
        this.notificationService.showError('Erro ao Atualizar', 'Não foi possível atualizar a academia. Tente novamente.');
      },
    });
  }

  private toDTO(): UpdateAcademyDTO {
    const v = this.form.value;
    return {
      name: v.name!,
      isActive: v.isActive ?? true,
    } as UpdateAcademyDTO;
  }
}
