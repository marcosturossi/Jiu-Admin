import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GraduationRequirementsService, BeltService, ShowBeltDTO as ShowBeltDTO } from '../../../../generated_services';
import { CreateGraduationRequirementDTO } from '../../../../generated_services/model/createGraduationRequirementDTO';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-graduation-requirement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './create-graduation-requirement.component.html',
  styleUrl: './create-graduation-requirement.component.scss',
})
export class CreateGraduationRequirementComponent {
  readonly closeEvent = output<void>();
  readonly graduationRequirementCreated = output<void>();

  private readonly graduationRequirementsService = inject(GraduationRequirementsService);
  private readonly beltService = inject(BeltService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly belts = signal<ShowBeltDTO[]>([]);

  protected readonly form = this.fb.group({
    beltId: ['', Validators.required],
    description: ['', Validators.required],
    minimumClasses: [0, [Validators.min(0)]],
  });

  constructor() {
    this.beltService.apiBeltGet().subscribe({
      next: r => this.belts.set(r?.items ?? []),
      error: () => this.ns.showError('Erro ao Carregar Faixas!', 'Não foi possível carregar a lista de faixas. Tente novamente.'),
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.graduationRequirementsService.apiGraduationRequirementsPost(this.toDTO()).subscribe({
      next: () => {
        this.ns.showSuccess('Requisito de Graduação Criado!', 'O requisito de graduação foi criado com sucesso.');
        this.graduationRequirementCreated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Criar Requisito!', 'Não foi possível criar o requisito de graduação. Tente novamente.'),
    });
  }

  private toDTO(): CreateGraduationRequirementDTO {
    const v = this.form.value;
    return { beltId: v.beltId, description: v.description, minimumClasses: v.minimumClasses ?? 0 } as CreateGraduationRequirementDTO;
  }
}
