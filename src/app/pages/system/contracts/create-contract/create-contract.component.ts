import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { FeePlanService } from '../../../../generated_services/api/feePlan.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ContractTermsTemplateService } from '../../../../generated_services/api/contractTermsTemplate.service';
import { ShowStudentDTO as ShowStudentDTO, ShowFeePlanDTO as ShowFeePlanDTO, ShowContractDTO as ShowContractDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { CreateFeePlanComponent } from '../../fee-plans/create-fee-plan/create-fee-plan.component';

@Component({
  selector: 'app-create-contract',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SearchSelectComponent, FieldErrorComponent, CreateFeePlanComponent],
  templateUrl: './create-contract.component.html',
  styleUrl: './create-contract.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateContractComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly feePlanService = inject(FeePlanService);
  private readonly studentsService = inject(StudentsService);
  private readonly contractTermsTemplateService = inject(ContractTermsTemplateService);
  private readonly ns = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly closeEvent = output<void>();
  readonly contractCreated = output<void>();

  protected readonly openedCreateFeePlan = signal(false);

  protected readonly isSaving = signal(false);

  protected readonly studentOptions = signal<SearchOption[]>([]);
  protected readonly feePlanOptions = signal<SearchOption[]>([]);
  protected readonly contractTermsTemplateOptions = signal<SearchOption[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  protected readonly selectedFeePlan = signal<SearchOption | null>(null);
  protected readonly selectedContractTermsTemplate = signal<SearchOption | null>(null);
  private readonly allFeePlans = signal<ShowFeePlanDTO[]>([]);
  protected readonly selectedFeePlanData = signal<ShowFeePlanDTO | null>(null);

  private readonly studentSearchSubject = new Subject<string>();
  private readonly feePlanSearchSubject = new Subject<string>();
  private readonly contractTermsTemplateSearchSubject = new Subject<string>();

  protected readonly form = this.fb.group({
    studentId: ['', Validators.required],
    feePlanId: ['', Validators.required],
    startDate: [null as string | null, Validators.required],
    notes: [''],
    // Optional: CreateContractUseCase defaults to the most-recently-created template server-side
    // when this is left unset (e.g. the tenant has none yet) — the picker just pre-selects that
    // same "most recent" choice client-side so the admin sees it and can override it.
    contractTermsTemplateId: [''],
  });

  constructor() {
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    this.feePlanSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadFeePlans(term));
    this.contractTermsTemplateSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadContractTermsTemplates(term));
    this.loadStudents();
    this.loadFeePlans();
    this.loadContractTermsTemplates();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const startDate = raw.startDate ?? undefined;

    this.isSaving.set(true);
    this.contractService
      .apiContractPost({
        personId: raw.studentId!,
        feePlanId: raw.feePlanId!,
        startDate,
        notes: raw.notes || null,
        contractTermsTemplateId: raw.contractTermsTemplateId || null,
      })
      .subscribe({
        next: (result: ShowContractDTO) => {
          this.isSaving.set(false);
          const months = result.feePlanMonthDuration ?? 0;
          this.ns.showSuccess(
            'Contrato Criado!',
            `Contrato criado com sucesso. ${months} mensalidade${months !== 1 ? 's' : ''} gerada${months !== 1 ? 's' : ''} automaticamente.`
          );
          this.contractCreated.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.ns.showError('Erro ao Criar!', extractErrorMessage(err, 'Não foi possível criar o contrato.'));
        },
      });
  }

  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.form.patchValue({ studentId: opt?.id ?? '' });
  }

  protected onStudentSearch(term: string): void {
    this.studentSearchSubject.next(term);
  }

  protected onFeePlanSelected(opt: SearchOption | null): void {
    this.selectedFeePlan.set(opt);
    this.form.patchValue({ feePlanId: opt?.id ?? '' });
    const plan = opt ? this.allFeePlans().find(p => p.id === opt.id) ?? null : null;
    this.selectedFeePlanData.set(plan);
  }

  protected onFeePlanSearch(term: string): void {
    this.feePlanSearchSubject.next(term);
  }

  protected onContractTermsTemplateSelected(opt: SearchOption | null): void {
    this.selectedContractTermsTemplate.set(opt);
    this.form.patchValue({ contractTermsTemplateId: opt?.id ?? '' });
  }

  protected onContractTermsTemplateSearch(term: string): void {
    this.contractTermsTemplateSearchSubject.next(term);
  }

  protected close(): void { this.closeEvent.emit(); }

  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsGet(term || undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        const students: ShowStudentDTO[] = result?.items ?? [];
        this.studentOptions.set(
          students.map(s => ({
            id: s.id!,
            label: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.userName || s.id!,
          })),
        );
      },
    });
  }

  protected onFeePlanCreated(plan: ShowFeePlanDTO): void {
    this.openedCreateFeePlan.set(false);
    this.allFeePlans.update(plans => [plan, ...plans]);
    const option: SearchOption = {
      id: plan.id!,
      label: `${plan.name ?? ''} — R$ ${(plan.price as unknown as number)?.toFixed(2) ?? '0,00'}`,
    };
    this.feePlanOptions.update(options => [option, ...options]);
    this.selectedFeePlan.set(option);
    this.selectedFeePlanData.set(plan);
    this.form.patchValue({ feePlanId: plan.id ?? '' });
  }

  private loadFeePlans(term = ''): void {
    this.feePlanService.apiFeePlanGet(term || undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        const plans = result?.items ?? [];
        this.allFeePlans.set(plans);
        this.feePlanOptions.set(
          plans.map((p: ShowFeePlanDTO) => ({
            id: p.id!,
            label: `${p.name ?? ''} — R$ ${(p.price as unknown as number)?.toFixed(2) ?? '0,00'}`,
          })),
        );
      },
    });
  }

  private loadContractTermsTemplates(term = ''): void {
    // Newest first, matching CreateContractUseCase's own "most recently created" default.
    this.contractTermsTemplateService.apiContractTermsTemplateGet(term || undefined, 1, 100, 'createdat', true).subscribe({
      next: result => {
        const templates = result?.items ?? [];
        const options = templates.map(t => ({ id: t.id!, label: t.name! }));
        this.contractTermsTemplateOptions.set(options);
        // Pre-select the most recent template only on the initial unfiltered load, and only if
        // nothing's been picked yet — mirrors the server-side default without overriding a
        // choice the admin already made while searching.
        if (!term && !this.selectedContractTermsTemplate() && options.length > 0) {
          this.onContractTermsTemplateSelected(options[0]);
        }
      },
    });
  }
}
