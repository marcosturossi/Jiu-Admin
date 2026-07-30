import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentContractInfo } from './student-onboarding.component';
import { ShowFeePlanDTO } from '../../../generated_services/model/showFeePlanDTO';
import { CreateFeePlanComponent } from '../fee-plans/create-fee-plan/create-fee-plan.component';

@Component({
  selector: 'app-onboarding-contract-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateFeePlanComponent],
  template: `
    <form class="onboarding-form">
      <h3>Contrato e Plano de Mensalidade</h3>

      <p class="form-description">
        Selecione o plano de mensalidade e a data de início do contrato.
      </p>

      <div class="form-section">
        <div class="form-group">
          <label for="feePlanId" class="form-label">Plano de Mensalidade <span class="text-danger">*</span></label>
          <div class="d-flex gap-2">
            <select
              id="feePlanId"
              class="form-select flex-grow-1"
              [(ngModel)]="data().feePlanId"
              [ngModelOptions]="{standalone: true}"
              (ngModelChange)="onDataChange('feePlanId', $event)"
            >
              <option value="">Selecione um plano...</option>
              @for (plan of feePlans(); track plan.id) {
                <option [value]="plan.id">{{ plan.name }} — R$ {{ $any(plan.price)?.toFixed(2) }}/mês ({{ plan.monthDuration }} {{ plan.monthDuration === 1 ? 'mês' : 'meses' }})</option>
              }
            </select>
            <button type="button" class="btn btn-outline-secondary" title="Novo plano" (click)="openedCreateFeePlan.set(true)">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
          <small class="form-text-muted">O plano de aulas do aluno</small>
        </div>

        <div class="form-group">
          <label for="startDate" class="form-label">Data de Início do Contrato <span class="text-danger">*</span></label>
          <input
            type="date"
            id="startDate"
            class="form-control"
            [(ngModel)]="data().startDate"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('startDate', $event)"
          />
          <small class="form-text-muted">Quando começa a cobrança</small>
        </div>
      </div>

      <div class="info-box">
        <i class="bi bi-info-circle"></i>
        <div>
          <strong>Nota:</strong> O aluno receberá um contrato por email para assinatura digital.
        </div>
      </div>
    </form>

    @if (openedCreateFeePlan()) {
      <div class="modal-backdrop-custom" (click)="openedCreateFeePlan.set(false)"></div>
      <div class="modal show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Novo Plano</h5>
              <button type="button" class="btn-close" (click)="openedCreateFeePlan.set(false)" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <app-create-fee-plan
                (closeEvent)="openedCreateFeePlan.set(false)"
                (feePlanCreated)="onFeePlanCreated($event)" />
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .onboarding-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;

      h3 {
        margin: 0;
        color: var(--brand-text);
        font-size: 1.25rem;
      }
    }

    .form-description {
      color: var(--brand-muted);
      margin: 0;
      font-size: 0.95rem;
    }

    .form-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-weight: 500;
      color: var(--brand-text);
      font-size: 0.875rem;
    }

    .form-control,
    .form-select {
      padding: 0.75rem;
      border: 1px solid var(--brand-border);
      border-radius: 4px;
      background: var(--brand-white);
      color: var(--brand-text);
      font-family: inherit;
      font-size: 0.95rem;

      &:focus {
        outline: none;
        border-color: var(--brand-primary);
        box-shadow: 0 0 0 3px rgba(56, 56, 56, 0.1);
      }
    }

    .form-text-muted {
      font-size: 0.8rem;
      color: var(--brand-muted);
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(13, 202, 240, 0.1);
      border: 1px solid rgba(13, 202, 240, 0.3);
      border-radius: 4px;
      color: var(--brand-info);
      font-size: 0.875rem;

      i {
        flex-shrink: 0;
        font-size: 1.1rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingContractFormComponent {
  readonly data = input.required<StudentContractInfo>();
  readonly feePlans = input<ShowFeePlanDTO[]>([]);
  readonly dataChange = output<Partial<StudentContractInfo>>();
  /** Bubbled up so the wizard (owner of `feePlans`) can keep its copy in sync too. */
  readonly feePlanCreated = output<ShowFeePlanDTO>();

  protected readonly openedCreateFeePlan = signal(false);

  protected onDataChange(field: string, value: any): void {
    this.dataChange.emit({ [field]: value });
  }

  protected onFeePlanCreated(plan: ShowFeePlanDTO): void {
    this.openedCreateFeePlan.set(false);
    this.onDataChange('feePlanId', plan.id ?? '');
    this.feePlanCreated.emit(plan);
  }
}
