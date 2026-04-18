import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface NavItem {
  route: string;
  label: string;
  icon: string;
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

  protected readonly navItems: NavItem[] = [
    { route: '/system/home', label: 'Home', icon: 'pi pi-home' },
    { route: '/system/students', label: 'Alunos', icon: 'pi pi-users' },
    { route: '/system/lessons', label: 'Aulas', icon: 'pi pi-calendar' },
    { route: '/system/graduations', label: 'Graduações', icon: 'pi pi-star' },
    { route: '/system/frequencies', label: 'Frequências', icon: 'pi pi-check-square' },
    { route: '/system/belts', label: 'Faixas', icon: 'pi pi-bookmark' },
    { route: '/system/graduation-requirements', label: 'Requisitos de Faixas', icon: 'pi pi-list-check' },
    { route: '/system/notices', label: 'Avisos', icon: 'pi pi-bell' },
    { route: '/system/notification', label: 'Notificações', icon: 'pi pi-megaphone' },
    { route: '/system/face-recognition', label: 'Reconhecimento', icon: 'pi pi-id-card' },
    { route: '/system/medical-clearances', label: 'Atestados Médicos', icon: 'pi pi-file' },
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
