import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentBasicInfo, StudentBeltInfo, StudentContractInfo, StudentMedicalInfo } from './student-onboarding.component';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';
import { ShowFeePlanDTO } from '../../../generated_services/model/showFeePlanDTO';

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
            <h4>Faixa</h4>
          </div>
          <div class="summary-content">
            @if (beltInfo().beltId) {
              <div class="summary-row">
                <span class="label">Faixa:</span>
                <span class="value">{{ getBeltName() }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Data de Início:</span>
                <span class="value">{{ formatDate(beltInfo().startDate) }}</span>
              </div>
            } @else {
              <p class="text-muted fst-italic mb-0">Nenhuma faixa selecionada.</p>
            }
          </div>
        </div>

        <!-- Contract Info Summary -->
        <div class="summary-section">
          <div class="section-header">
            <i class="bi bi-receipt"></i>
            <h4>Plano de Mensalidade</h4>
          </div>
          <div class="summary-content">
            @if (contractInfo().feePlanId) {
              <div class="summary-row">
                <span class="label">Plano:</span>
                <span class="value">{{ getFeePlanName() }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Data de Início:</span>
                <span class="value">{{ formatDate(contractInfo().startDate) }}</span>
              </div>
            } @else {
              <p class="text-muted fst-italic mb-0">Nenhum plano selecionado.</p>
            }
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
                  [(ngModel)]="medicalInfo().hasClearance"
                  [ngModelOptions]="{standalone: true}"
                  (ngModelChange)="updateMedical('hasClearance', $event)"
                />
                <span>Cadastrar atestado médico agora</span>
              </label>
            </div>

            @if (medicalInfo().hasClearance) {
              <div class="form-group">
                <label for="expiresAt" class="form-label">Validade do Atestado <span class="text-danger">*</span></label>
                <input
                  type="date"
                  id="expiresAt"
                  class="form-control"
                  [(ngModel)]="medicalInfo().expiresAt"
                  [ngModelOptions]="{standalone: true}"
                  (ngModelChange)="updateMedical('expiresAt', $event)"
                />
              </div>

              <div class="form-group">
                <label class="form-checkbox">
                  <input
                    type="checkbox"
                    [(ngModel)]="medicalInfo().isApproved"
                    [ngModelOptions]="{standalone: true}"
                    (ngModelChange)="updateMedical('isApproved', $event)"
                  />
                  <span>Aluno aprovado para atividade física</span>
                </label>
              </div>

              <div class="form-group">
                <label for="medicalClearance" class="form-label">Anexar Atestado (Opcional):</label>
                <input
                  type="file"
                  id="medicalClearance"
                  class="form-control"
                  accept=".pdf,.jpg,.jpeg,.png"
                  (change)="onFileChange($event)"
                />
                <small class="form-text-muted">PDF ou Imagem (max 5MB)</small>
              </div>
            }
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
      background: var(--brand-surface);
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
  readonly belts = input<ShowBeltDTO[]>([]);
  readonly feePlans = input<ShowFeePlanDTO[]>([]);
  readonly medicalDataChange = output<Partial<StudentMedicalInfo>>();
  readonly termsChange = output<boolean>();

  protected termsAccepted = false;

  protected updateMedical(field: string, value: any): void {
    this.medicalDataChange.emit({ [field]: value });
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.medicalDataChange.emit({ clearanceFile: input.files?.[0] ?? null });
  }

  protected onTermsChange(value: boolean): void {
    this.termsAccepted = value;
    this.termsChange.emit(value);
  }

  protected formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  protected getBeltName(): string {
    return this.belts().find(b => b.id === this.beltInfo().beltId)?.color ?? '-';
  }

  protected getFeePlanName(): string {
    return this.feePlans().find(p => p.id === this.contractInfo().feePlanId)?.name ?? '-';
  }
}
