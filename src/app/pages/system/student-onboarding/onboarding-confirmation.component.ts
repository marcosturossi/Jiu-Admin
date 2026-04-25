import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentBasicInfo, StudentBeltInfo, StudentContractInfo, StudentMedicalInfo } from './student-onboarding.component';

@Component({
  selector: 'app-onboarding-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="confirmation-container">
      <h3>Resumo e Confirmação</h3>

      <div class="confirmation-summary">
        <!-- Basic Info Summary -->
        <div class="summary-section">
          <div class="section-header">
            <i class="bi bi-person"></i>
            <h4>Informações Pessoais</h4>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="label">Nome:</span>
              <span class="value">{{ basicInfo().name }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Email:</span>
              <span class="value">{{ basicInfo().email }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Telefone:</span>
              <span class="value">{{ basicInfo().phone }}</span>
            </div>
            <div class="summary-row">
              <span class="label">CPF:</span>
              <span class="value">{{ basicInfo().cpf }}</span>
            </div>
          </div>
        </div>

        <!-- Belt Info Summary -->
        <div class="summary-section">
          <div class="section-header">
            <i class="bi bi-award"></i>
            <h4>Faixa e Graduação</h4>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="label">Faixa:</span>
              <span class="value">{{ getBeltName() }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Graduação:</span>
              <span class="value">{{ beltInfo().graduationId }}º Grau</span>
            </div>
            <div class="summary-row">
              <span class="label">Data de Início:</span>
              <span class="value">{{ formatDate(beltInfo().startDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Contract Info Summary -->
        <div class="summary-section">
          <div class="section-header">
            <i class="bi bi-receipt"></i>
            <h4>Plano de Mensalidade</h4>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="label">Plano:</span>
              <span class="value">{{ getFeePlanName() }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Tipo de Contrato:</span>
              <span class="value">{{ getContractType() }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Data de Início:</span>
              <span class="value">{{ formatDate(contractInfo().startDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Medical Info -->
        <div class="summary-section">
          <div class="section-header">
            <i class="bi bi-heart-pulse"></i>
            <h4>Saúde e Atestados</h4>
          </div>
          <div class="summary-content">
            <div class="form-group">
              <label class="form-checkbox">
                <input
                  type="checkbox"
                  [(ngModel)]="medicalInfo().hasRestrictions"
                  [ngModelOptions]="{standalone: true}"
                  (ngModelChange)="updateMedical('hasRestrictions', $event)"
                />
                <span>O aluno tem restrições médicas</span>
              </label>
            </div>

            @if (medicalInfo().hasRestrictions) {
              <div class="form-group">
                <label for="restrictions" class="form-label">Descreva as restrições:</label>
                <textarea
                  id="restrictions"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="medicalInfo().restrictions"
                  [ngModelOptions]="{standalone: true}"
                  (ngModelChange)="updateMedical('restrictions', $event)"
                  placeholder="Ex: Lesão no joelho, alergia a..."
                ></textarea>
              </div>
            }

            <div class="form-group">
              <label for="medicalClearance" class="form-label">Atestado Médico (Opcional):</label>
              <input
                type="file"
                id="medicalClearance"
                class="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
                (change)="onFileChange($event)"
              />
              <small class="form-text-muted">PDF ou Imagem (max 5MB)</small>
            </div>
          </div>
        </div>
      </div>

      <div class="terms-box">
        <label class="form-checkbox">
          <input
            type="checkbox"
            [(ngModel)]="termsAccepted"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onTermsChange($event)"
            required
          />
          <span>Confirmo que os dados estão corretos e autorizo o cadastro</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;

      h3 {
        margin: 0;
        color: var(--brand-text);
        font-size: 1.25rem;
      }
    }

    .confirmation-summary {
      display: grid;
      gap: 1.5rem;
    }

    .summary-section {
      border: 1px solid var(--brand-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--brand-bg);
      border-bottom: 1px solid var(--brand-border);

      i {
        font-size: 1.2rem;
        color: var(--brand-primary);
      }

      h4 {
        margin: 0;
        color: var(--brand-text);
        font-size: 0.95rem;
        font-weight: 600;
      }
    }

    .summary-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--brand-border);

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 500;
        color: var(--brand-muted);
        font-size: 0.875rem;
      }

      .value {
        color: var(--brand-text);
        font-weight: 500;
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

    .form-control {
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

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;

      input[type="checkbox"] {
        cursor: pointer;
        width: 18px;
        height: 18px;
      }

      span {
        color: var(--brand-text);
        font-size: 0.95rem;
      }
    }

    .terms-box {
      padding: 1rem;
      background: rgba(25, 135, 84, 0.1);
      border: 1px solid rgba(25, 135, 84, 0.3);
      border-radius: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingConfirmationComponent {
  readonly basicInfo = input.required<StudentBasicInfo>();
  readonly beltInfo = input.required<StudentBeltInfo>();
  readonly contractInfo = input.required<StudentContractInfo>();
  readonly medicalInfo = input.required<StudentMedicalInfo>();
  readonly medicalDataChange = output<Partial<StudentMedicalInfo>>();
  readonly submit = output<void>();

  protected termsAccepted = false;

  protected updateMedical(field: string, value: any): void {
    this.medicalDataChange.emit({ [field]: value });
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      console.log('File selected:', file.name);
    }
  }

  protected onTermsChange(value: boolean): void {
    this.termsAccepted = value;
  }

  protected formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  protected getBeltName(): string {
    const belts: Record<string, string> = {
      white: 'Branca',
      blue: 'Azul',
      purple: 'Roxa',
      brown: 'Marrom',
      black: 'Preta',
    };
    return belts[this.beltInfo().beltId] || '-';
  }

  protected getFeePlanName(): string {
    const plans: Record<string, string> = {
      basic: 'Plano Básico - 2 aulas/semana',
      standard: 'Plano Padrão - 4 aulas/semana',
      premium: 'Plano Premium - Aulas ilimitadas',
      kids: 'Plano Kids - Crianças',
    };
    return plans[this.contractInfo().feePlanId] || '-';
  }

  protected getContractType(): string {
    const types: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
    };
    return types[this.contractInfo().contractId] || 'Sem contrato específico';
  }
}
