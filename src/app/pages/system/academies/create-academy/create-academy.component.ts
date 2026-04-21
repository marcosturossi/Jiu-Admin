import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { CreateAcademyDTO } from '../../../../generated_services/model/createAcademyDTO';
import { NotificationService } from '../../../../services/notification.service';

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
    keycloakRealm: [''],
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
      error: () => {
        this.notificationService.showError('Erro ao Criar', 'Não foi possível criar a academia. Tente novamente.');
      },
    });
  }

  private toDTO(): CreateAcademyDTO {
    const v = this.form.value;
    return {
      name: v.name!,
      slug: v.slug!,
      keycloakRealm: v.keycloakRealm || null,
    } as CreateAcademyDTO;
  }
}
