import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentContractInfo } from './student-onboarding.component';

@Component({
  selector: 'app-onboarding-contract-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="onboarding-form">
      <h3>Contrato e Plano de Mensalidade</h3>

      <p class="form-description">
        Selecione o plano de mensalidade e a data de início do contrato.
      </p>

      <div class="form-section">
        <div class="form-group">
          <label for="feePlanId" class="form-label">Plano de Mensalidade *</label>
          <select
            id="feePlanId"
            class="form-select"
            [(ngModel)]="data().feePlanId"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('feePlanId', $event)"
          >
            <option value="">Selecione um plano...</option>
            <option value="basic">Plano Básico - 2 aulas/semana</option>
            <option value="standard">Plano Padrão - 4 aulas/semana</option>
            <option value="premium">Plano Premium - Aulas ilimitadas</option>
            <option value="kids">Plano Kids - Crianças</option>
          </select>
          <small class="form-text-muted">O plano de aulas do aluno</small>
        </div>

        <div class="form-group">
          <label for="startDate" class="form-label">Data de Início do Contrato *</label>
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

      <div class="form-section">
        <div class="form-group">
          <label for="contractId" class="form-label">Tipo de Contrato</label>
          <select
            id="contractId"
            class="form-select"
            [(ngModel)]="data().contractId"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('contractId', $event)"
          >
            <option value="">Sem contrato específico</option>
            <option value="monthly">Mensal</option>
            <option value="quarterly">Trimestral</option>
            <option value="annual">Anual</option>
          </select>
          <small class="form-text-muted">Duração do contrato</small>
        </div>
      </div>

      <div class="pricing-info">
        <div class="pricing-item">
          <span class="pricing-label">Plano:</span>
          <span class="pricing-value">{{ getFeePlanName() }}</span>
        </div>
      </div>

      <div class="info-box">
        <i class="bi bi-info-circle"></i>
        <div>
          <strong>Nota:</strong> O aluno receberá um contrato por email para assinatura digital.
        </div>
      </div>
    </form>
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

    .pricing-info {
      padding: 1rem;
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pricing-item {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
    }

    .pricing-label {
      font-weight: 500;
      color: var(--brand-muted);
    }

    .pricing-value {
      color: var(--brand-text);
      font-weight: 600;
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
  readonly dataChange = output<Partial<StudentContractInfo>>();

  protected onDataChange(field: string, value: any): void {
    this.dataChange.emit({ [field]: value });
  }

  protected getFeePlanName(): string {
    const plans: Record<string, string> = {
      basic: 'Plano Básico - 2 aulas/semana',
      standard: 'Plano Padrão - 4 aulas/semana',
      premium: 'Plano Premium - Aulas ilimitadas',
      kids: 'Plano Kids - Crianças',
    };
    return plans[this.data().feePlanId] || 'Selecione um plano';
  }
}
