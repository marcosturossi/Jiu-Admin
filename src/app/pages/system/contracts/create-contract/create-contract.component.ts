import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { FeePlanService } from '../../../../generated_services/api/feePlan.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, ShowFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-create-contract',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent],
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

  protected readonly studentOptions = signal<SearchOption[]>([]);
  protected readonly feePlanOptions = signal<SearchOption[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  protected readonly selectedFeePlan = signal<SearchOption | null>(null);

  protected readonly form = this.fb.group({
    studentId: ['', Validators.required],
    feePlanId: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    notes: [''],
  });

  constructor() {
    this.loadStudents();
    this.loadFeePlans();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    // <input type="date"> always yields a YYYY-MM-DD string, not a Date object.
    const startDate = raw.startDate ? String(raw.startDate) : undefined;

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

  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.form.patchValue({ studentId: opt?.id ?? '' });
  }

  protected onStudentSearch(term: string): void {
    this.loadStudents(term);
  }

  protected onFeePlanSelected(opt: SearchOption | null): void {
    this.selectedFeePlan.set(opt);
    this.form.patchValue({ feePlanId: opt?.id ?? '' });
  }

  protected onFeePlanSearch(term: string): void {
    this.loadFeePlans(term);
  }

  protected close(): void { this.closeEvent.emit(); }

  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsActiveGet(term || undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: (students: ShowStudentDTO[]) => {
        this.studentOptions.set(
          students.map(s => ({
            id: s.id!,
            label: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.userName || s.id!,
          })),
        );
      },
    });
  }

  private loadFeePlans(term = ''): void {
    this.feePlanService.apiFeePlanGet(term || undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        this.feePlanOptions.set(
          (result.items ?? []).map((p: ShowFeePlanDTO) => ({
            id: p.id!,
            label: `${p.name ?? ''} — R$ ${p.price?.toFixed(2) ?? '0,00'}`,
          })),
        );
      },
    });
  }
}
