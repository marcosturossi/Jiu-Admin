import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Keycloak from 'keycloak-js';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthServiceService } from '../../services/auth-service.service';
import { AcademySessionService } from '../../services/academy-session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly keycloak        = inject(Keycloak);
  private readonly authService     = inject(AuthServiceService);
  private readonly academySession  = inject(AcademySessionService);

  protected readonly sidebarOpen = signal(false);
  protected readonly userName    = signal<string>('');

  protected readonly userMenuItems: MenuItem[] = [
    {
      label: 'Trocar Academia',
      icon: 'pi pi-building',
      command: () => this.switchAcademy(),
    },
    {
      separator: true,
    },
    {
      label: 'Sair',
      icon: 'pi pi-sign-out',
      command: () => this.logout(),
    },
  ];

  private observer?: MutationObserver;

  ngOnInit(): void {
    this.userName.set(this.authService.getUsernameFromToken() ?? '');
    this.observer = new MutationObserver(() => {
      this.sidebarOpen.set(document.body.classList.contains('sidebar-open'));
    });
    this.observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected toggleSidebar(): void {
    const next = !this.sidebarOpen();
    this.sidebarOpen.set(next);
    document.body.classList.toggle('sidebar-open', next);
  }

  private switchAcademy(): void {
    this.academySession.clearAcademy();
    this.keycloak.logout({ redirectUri: window.location.origin + '/select-academy' });
  }

  private logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
