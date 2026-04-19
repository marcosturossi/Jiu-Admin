import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { FeePlanService } from '../../../../generated_services/api/feePlan.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, ShowFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-contract',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, SelectModule, DatePickerModule, TextareaModule],
  templateUrl: './create-contract.component.html',
  styleUrl: './create-contract.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateContractComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly feePlanService = inject(FeePlanService);
  private readonly studentsService = inject(StudentsService);
  private readonly ns = inject(NotificationService);

  readonly closeEvent = output<void>();
  readonly contractCreated = output<void>();

  protected readonly isSaving = signal(false);

  protected readonly studentOptions = signal<{ label: string; value: string }[]>([]);
  protected readonly feePlanOptions = signal<{ label: string; value: string }[]>([]);

  protected readonly form = this.fb.group({
    studentId: ['', Validators.required],
    feePlanId: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    notes: [''],
  });

  constructor() {
    this.studentsService.apiStudentsActiveGet().subscribe({
      next: (students: ShowStudentDTO[]) => {
        this.studentOptions.set(
          students.map(s => ({
            label: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.userName || s.id!,
            value: s.id!,
          })),
        );
      },
    });

    this.feePlanService.apiFeePlanGet(undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        this.feePlanOptions.set(
          (result.items ?? []).map((p: ShowFeePlanDTO) => ({
            label: `${p.name ?? ''} — R$ ${p.price?.toFixed(2) ?? '0,00'}`,
            value: p.id!,
          })),
        );
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const startDate = raw.startDate ? (raw.startDate as Date).toISOString().split('T')[0] : undefined;

    this.isSaving.set(true);
    this.contractService
      .apiContractPost({ studentId: raw.studentId!, feePlanId: raw.feePlanId!, startDate, notes: raw.notes || null })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.ns.showSuccess('Contrato Criado!', 'Contrato criado com sucesso.');
          this.contractCreated.emit();
        },
        error: () => {
          this.isSaving.set(false);
          this.ns.showError('Erro ao Criar!', 'Não foi possível criar o contrato.');
        },
      });
  }

  protected close(): void { this.closeEvent.emit(); }
}
