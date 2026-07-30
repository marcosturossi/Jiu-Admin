import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentBeltInfo } from './student-onboarding.component';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';
import { CreateBeltComponent } from '../belts/create-belt/create-belt.component';

@Component({
  selector: 'app-onboarding-belt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateBeltComponent],
  template: `
    <form class="onboarding-form">
      <h3>Seleção de Faixa</h3>

      <p class="form-description">
        Selecione a faixa inicial do aluno.
      </p>

      <div class="form-section">
        <div class="form-group">
          <label for="beltId" class="form-label">Faixa <span class="text-danger">*</span></label>
          <div class="d-flex gap-2">
            <select
              id="beltId"
              class="form-select flex-grow-1"
              [(ngModel)]="data().beltId"
              [ngModelOptions]="{standalone: true}"
              (ngModelChange)="onDataChange('beltId', $event)"
            >
              <option value="">Selecione uma faixa...</option>
              @for (belt of belts(); track belt.id) {
                <option [value]="belt.id">{{ belt.color }}</option>
              }
            </select>
            <button type="button" class="btn btn-outline-secondary" title="Nova faixa" (click)="openedCreateBelt.set(true)">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
          <small class="form-text-muted">A faixa inicial do aluno</small>
        </div>

        <div class="form-group">
          <label for="startDate" class="form-label">Data de Início <span class="text-danger">*</span></label>
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

    @if (openedCreateBelt()) {
      <div class="modal-backdrop-custom" (click)="openedCreateBelt.set(false)"></div>
      <div class="modal show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Nova Faixa</h5>
              <button type="button" class="btn-close" (click)="openedCreateBelt.set(false)" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <app-create-belt
                (closeEvent)="openedCreateBelt.set(false)"
                (beltCreated)="onBeltCreated($event)" />
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
export class OnboardingBeltFormComponent {
  readonly data = input.required<StudentBeltInfo>();
  readonly belts = input<ShowBeltDTO[]>([]);
  readonly dataChange = output<Partial<StudentBeltInfo>>();
  /** Bubbled up so the wizard (owner of `belts`) can keep its copy in sync too. */
  readonly beltCreated = output<ShowBeltDTO>();

  protected readonly openedCreateBelt = signal(false);

  protected onDataChange(field: string, value: any): void {
    this.dataChange.emit({ [field]: value });
  }

  protected onBeltCreated(belt: ShowBeltDTO): void {
    this.openedCreateBelt.set(false);
    this.onDataChange('beltId', belt.id ?? '');
    this.beltCreated.emit(belt);
  }
}
