import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { CreateAcademyDto } from '../../../../generated_services/model/createAcademyDto';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

@Component({
  selector: 'app-create-academy',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-academy.component.html',
  styleUrl: './create-academy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAcademyComponent {
  readonly closeEvent = output<void>();
  readonly academyCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly academyService = inject(AcademyService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
  });

  protected close(): void {
    this.closeEvent.emit();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.academyService.apiAdminAcademiesPost(this.toDTO()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Academia Criada!', 'A nova academia foi criada com sucesso.');
        this.academyCreated.emit();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Criar', extractErrorMessage(err, 'Não foi possível criar a academia. Tente novamente.'));
      },
    });
  }

  private toDTO(): CreateAcademyDto {
    const v = this.form.getRawValue();
    return {
      name: v.name ?? '',
      slug: v.slug ?? '',
      adminEmail: v.adminEmail ?? '',
      adminFirstName: v.adminFirstName ?? '',
      adminLastName: v.adminLastName ?? '',
    };
  }
}
