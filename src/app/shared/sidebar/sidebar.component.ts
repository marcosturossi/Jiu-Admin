import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface NavItem {
  route: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly router = inject(Router);

  protected readonly sections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { route: '/system/home', label: 'Dashboard', icon: 'bi bi-house' },
      ]
    },
    {
      title: 'Acadêmico',
      items: [
        { route: '/system/students', label: 'Alunos', icon: 'bi bi-people' },
        { route: '/system/lessons', label: 'Aulas', icon: 'bi bi-calendar3' },
        { route: '/system/graduations', label: 'Graduações', icon: 'bi bi-award' },
        { route: '/system/frequencies', label: 'Frequências', icon: 'bi bi-check2-square' },
        { route: '/system/belts', label: 'Faixas', icon: 'bi bi-bookmark' },
        { route: '/system/graduation-requirements', label: 'Requisitos', icon: 'bi bi-list-check' },
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { route: '/system/contracts', label: 'Contratos', icon: 'bi bi-file-earmark-text' },
        { route: '/system/monthly-fees', label: 'Mensalidades', icon: 'bi bi-credit-card' },
        { route: '/system/fee-plans', label: 'Planos', icon: 'bi bi-receipt' },
        { route: '/system/transactions', label: 'Transações', icon: 'bi bi-arrow-left-right' },
        { route: '/system/transaction-categories', label: 'Categorias', icon: 'bi bi-tags' },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { route: '/system/notices', label: 'Avisos', icon: 'bi bi-bell' },
        { route: '/system/notification', label: 'Notificações', icon: 'bi bi-megaphone' },
      ]
    },
    {
      title: 'Saúde e Segurança',
      items: [
        { route: '/system/medical-clearances', label: 'Atestados Médicos', icon: 'bi bi-heart-pulse' },
        { route: '/system/face-recognition', label: 'Reconhecimento', icon: 'bi bi-person-badge' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { route: '/system/academies', label: 'Academias', icon: 'bi bi-building' },
      ]
    },
  ];

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]).then(() => {
      if (window.innerWidth < 992) {
        document.body.classList.remove('sidebar-open');
      }
    });
  }

  close(): void {
    document.body.classList.remove('sidebar-open');
  }
}
