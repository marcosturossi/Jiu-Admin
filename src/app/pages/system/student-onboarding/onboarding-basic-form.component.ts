import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentBasicInfo } from './student-onboarding.component';

@Component({
  selector: 'app-onboarding-basic-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="onboarding-form">
      <h3>Informações Pessoais</h3>

      <div class="form-section">
        <div class="form-group">
          <label for="name" class="form-label">Nome Completo *</label>
          <input
            type="text"
            id="name"
            class="form-control"
            [(ngModel)]="data().name"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('name', $event)"
            required
          />
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email *</label>
          <input
            type="email"
            id="email"
            class="form-control"
            [(ngModel)]="data().email"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('email', $event)"
            required
          />
        </div>
      </div>

      <div class="form-section">
        <div class="form-group">
          <label for="phone" class="form-label">Telefone *</label>
          <input
            type="tel"
            id="phone"
            class="form-control"
            [(ngModel)]="data().phone"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('phone', $event)"
            placeholder="(XX) XXXXX-XXXX"
          />
        </div>

        <div class="form-group">
          <label for="cpf" class="form-label">CPF *</label>
          <input
            type="text"
            id="cpf"
            class="form-control"
            [(ngModel)]="data().cpf"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('cpf', $event)"
            placeholder="XXX.XXX.XXX-XX"
          />
        </div>
      </div>

      <div class="form-section">
        <div class="form-group">
          <label for="dateOfBirth" class="form-label">Data de Nascimento *</label>
          <input
            type="date"
            id="dateOfBirth"
            class="form-control"
            [(ngModel)]="data().dateOfBirth"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('dateOfBirth', $event)"
          />
        </div>

        <div class="form-group">
          <label for="gender" class="form-label">Gênero *</label>
          <select
            id="gender"
            class="form-select"
            [(ngModel)]="data().gender"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('gender', $event)"
          >
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="O">Outro</option>
          </select>
        </div>
      </div>

      <div class="form-section-title">
        <h4>Endereço</h4>
      </div>

      <div class="form-section">
        <div class="form-group">
          <label for="address" class="form-label">Rua *</label>
          <input
            type="text"
            id="address"
            class="form-control"
            [(ngModel)]="data().address"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('address', $event)"
          />
        </div>

        <div class="form-group">
          <label for="city" class="form-label">Cidade *</label>
          <input
            type="text"
            id="city"
            class="form-control"
            [(ngModel)]="data().city"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('city', $event)"
          />
        </div>
      </div>

      <div class="form-section">
        <div class="form-group">
          <label for="state" class="form-label">Estado *</label>
          <input
            type="text"
            id="state"
            class="form-control"
            [(ngModel)]="data().state"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('state', $event)"
            placeholder="UF"
            maxlength="2"
          />
        </div>

        <div class="form-group">
          <label for="zipCode" class="form-label">CEP *</label>
          <input
            type="text"
            id="zipCode"
            class="form-control"
            [(ngModel)]="data().zipCode"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onDataChange('zipCode', $event)"
            placeholder="XXXXX-XXX"
          />
        </div>
      </div>
    </form>
  `,
  styles: [`
    .onboarding-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      box-sizing: border-box;

      h3 {
        margin: 0;
        color: var(--brand-text);
        font-size: 1.25rem;
      }
    }

    .form-section-title {
      margin-top: 1rem;
      margin-bottom: 0;

      h4 {
        margin: 0;
        color: var(--brand-text);
        font-size: 0.95rem;
        font-weight: 600;
      }
    }

    .form-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      width: 100%;
      box-sizing: border-box;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      box-sizing: border-box;
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
      width: 100%;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: var(--brand-primary);
        box-shadow: 0 0 0 3px rgba(56, 56, 56, 0.1);
      }

      @media (prefers-color-scheme: dark) {
        background: var(--brand-white);
        color: var(--brand-text);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingBasicFormComponent {
  readonly data = input.required<StudentBasicInfo>();
  readonly dataChange = output<Partial<StudentBasicInfo>>();

  protected onDataChange(field: string, value: any): void {
    this.dataChange.emit({ [field]: value });
  }
}
