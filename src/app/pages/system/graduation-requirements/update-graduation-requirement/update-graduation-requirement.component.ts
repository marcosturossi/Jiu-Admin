import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GraduationRequirementsService, BeltService, ShowBeltDTO as ShowBeltDTO, ShowGraduationRequirementDTO as ShowGraduationRequirementsDTO, UpdateGraduationRequirementDTO as UpdateGraduationRequirementsDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-graduation-requirement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './update-graduation-requirement.component.html',
  styleUrl: './update-graduation-requirement.component.scss',
})
export class UpdateGraduationRequirementComponent {
  readonly closeEvent = output<void>();
  readonly graduationRequirementUpdated = output<void>();
  readonly requirement = input.required<ShowGraduationRequirementsDTO>();

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
    effect(() => {
      const r = this.requirement();
      this.form.patchValue({
        beltId: r.beltId,
        description: r.description,
        minimumClasses: (r.minimumClasses as unknown as number) ?? 0,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.graduationRequirementsService.apiGraduationRequirementsIdPut(this.requirement().id!, this.toDTO()).subscribe({
      next: () => {
        this.ns.showSuccess('Requisito Atualizado!', 'O requisito de graduação foi atualizado com sucesso.');
        this.graduationRequirementUpdated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Atualizar Requisito!', 'Não foi possível atualizar o requisito de graduação. Tente novamente.'),
    });
  }

  private toDTO(): UpdateGraduationRequirementsDTO {
    const v = this.form.value;
    return { beltId: v.beltId, description: v.description, minimumClasses: v.minimumClasses ?? 0 } as UpdateGraduationRequirementsDTO;
  }
}
