import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CreateGraduationDTO, ShowBeltDTO, ShowStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-graduation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './create-graduation.component.html',
  styleUrl: './create-graduation.component.scss',
})
export class CreateGraduationComponent {
  readonly closeEvent = output<void>();
  readonly graduationCreated = output<void>();

  private readonly graduationService = inject(GraduationService);
  private readonly beltService = inject(BeltService);
  private readonly studentsService = inject(StudentsService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly belts = signal<ShowBeltDTO[]>([]);
  protected readonly students = signal<ShowStudentDTO[]>([]);

  protected readonly studentOptions = computed(() =>
    this.students().map(s => ({ label: `${s.firstName} ${s.lastName} (${s.email})`, id: s.id }))
  );

  protected readonly form = this.fb.group({
    studentId: ['', Validators.required],
    beltId: ['', Validators.required],
    graduationDate: [new Date().toISOString().split('T')[0], Validators.required],
  });

  constructor() {
    this.beltService.apiBeltGet().subscribe({
      next: r => this.belts.set(r.items ?? []),
      error: () => this.ns.showError('Erro ao Carregar Faixas', 'Não foi possível carregar as faixas disponíveis.'),
    });
    this.studentsService.apiStudentsGet().subscribe({
      next: r => this.students.set(r.items ?? []),
      error: () => this.ns.showError('Erro ao Carregar Alunos', 'Não foi possível carregar a lista de alunos.'),
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, selecione um aluno e uma faixa.');
      return;
    }
    this.graduationService.apiGraduationPost(this.toDTO()).subscribe({
      next: () => {
        const s = this.students().find(x => x.id === this.form.value.studentId);
        const b = this.belts().find(x => x.id === this.form.value.beltId);
        this.ns.showSuccess('Graduação Criada!', `${s?.firstName} ${s?.lastName} foi graduado(a) para faixa ${b?.color}.`);
        this.graduationCreated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Criar Graduação!', 'Não foi possível criar a graduação. Tente novamente.'),
    });
  }

  private toDTO(): CreateGraduationDTO {
    const v = this.form.value;
    return { studentId: v.studentId, beltId: v.beltId, graduationDate: v.graduationDate } as CreateGraduationDTO;
  }
}
