import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuickAction {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent {
  protected readonly actions: QuickAction[] = [
    { label: 'Cadastrar Aluno', route: '/system/student-onboarding', icon: 'bi bi-person-plus' },
    { label: 'Novo Contrato', route: '/system/contracts', icon: 'bi bi-file-earmark-text' },
    { label: 'Registrar Frequência', route: '/system/frequencies', icon: 'bi bi-check2-square' },
    { label: 'Nova Cobrança', route: '/system/accounts-receivable', icon: 'bi bi-cash-coin' },
  ];
}
