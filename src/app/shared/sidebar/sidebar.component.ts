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
        { route: '/system/home', label: 'Dashboard', icon: 'pi pi-home' },
      ]
    },
    {
      title: 'Acadêmico',
      items: [
        { route: '/system/students', label: 'Alunos', icon: 'pi pi-users' },
        { route: '/system/lessons', label: 'Aulas', icon: 'pi pi-calendar' },
        { route: '/system/graduations', label: 'Graduações', icon: 'pi pi-star' },
        { route: '/system/frequencies', label: 'Frequências', icon: 'pi pi-check-square' },
        { route: '/system/belts', label: 'Faixas', icon: 'pi pi-bookmark' },
        { route: '/system/graduation-requirements', label: 'Requisitos', icon: 'pi pi-list-check' },
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { route: '/system/contracts', label: 'Contratos', icon: 'pi pi-file-edit' },
        { route: '/system/monthly-fees', label: 'Mensalidades', icon: 'pi pi-credit-card' },
        { route: '/system/fee-plans', label: 'Planos', icon: 'pi pi-receipt' },
        { route: '/system/transactions', label: 'Transações', icon: 'pi pi-arrow-right-arrow-left' },
        { route: '/system/transaction-categories', label: 'Categorias', icon: 'pi pi-tags' },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { route: '/system/notices', label: 'Avisos', icon: 'pi pi-bell' },
        { route: '/system/notification', label: 'Notificações', icon: 'pi pi-megaphone' },
      ]
    },
    {
      title: 'Saúde e Segurança',
      items: [
        { route: '/system/medical-clearances', label: 'Atestados Médicos', icon: 'pi pi-heart' },
        { route: '/system/face-recognition', label: 'Reconhecimento', icon: 'pi pi-id-card' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { route: '/system/academies', label: 'Academias', icon: 'pi pi-building' },
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
