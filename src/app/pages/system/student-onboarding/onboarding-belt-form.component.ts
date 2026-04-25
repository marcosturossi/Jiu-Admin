import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentBeltInfo } from './student-onboarding.component';

@Component({
  selector: 'app-onboarding-belt-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="onboarding-form">
      <h3>Seleção de Faixa e Graduação</h3>

      <p class="form-description">
        Selecione a faixa e a graduação inicial do aluno.
      </p>

      <div class="form-section">
        <div class="form-group">
          <label for="beltId" class="form-label">Faixa *</label>
          <select
            id="beltId"
            class="form-select"
            [(ngModel)]="data().beltId"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('beltId', $event)"
          >
            <option value="">Selecione uma faixa...</option>
            <option value="white">Branca</option>
            <option value="blue">Azul</option>
            <option value="purple">Roxa</option>
            <option value="brown">Marrom</option>
            <option value="black">Preta</option>
          </select>
          <small class="form-text-muted">A faixa inicial do aluno</small>
        </div>

        <div class="form-group">
          <label for="graduationId" class="form-label">Graduação *</label>
          <select
            id="graduationId"
            class="form-select"
            [(ngModel)]="data().graduationId"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('graduationId', $event)"
          >
            <option value="">Selecione uma graduação...</option>
            <option value="1">1º Grau</option>
            <option value="2">2º Grau</option>
            <option value="3">3º Grau</option>
            <option value="4">4º Grau</option>
          </select>
          <small class="form-text-muted">A graduação dentro da faixa</small>
        </div>

        <div class="form-group">
          <label for="startDate" class="form-label">Data de Início *</label>
          <input
            type="date"
            id="startDate"
            class="form-control"
            [(ngModel)]="data().startDate"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('startDate', $event)"
          />
          <small class="form-text-muted">Quando o aluno começará</small>
        </div>
      </div>

      <div class="info-box">
        <i class="bi bi-info-circle"></i>
        <div>
          <strong>Nota:</strong> Essas informações podem ser alteradas posteriormente no perfil do aluno.
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
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 992px) {
        grid-template-columns: 1fr 1fr;
      }

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
export class OnboardingBeltFormComponent {
  readonly data = input.required<StudentBeltInfo>();
  readonly dataChange = output<Partial<StudentBeltInfo>>();

  protected onDataChange(field: string, value: any): void {
    this.dataChange.emit({ [field]: value });
  }
}
