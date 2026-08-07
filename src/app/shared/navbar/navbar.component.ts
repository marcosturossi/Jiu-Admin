import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthServiceService } from '../../services/auth-service.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly keycloak       = inject(Keycloak);
  private readonly authService    = inject(AuthServiceService);
  protected readonly themeService = inject(ThemeService);

  protected readonly userName        = signal<string>('');
  protected readonly sidebarExpanded = signal(false);

  private readonly syncHandler = (event: Event) => {
    this.sidebarExpanded.set((event as CustomEvent).detail.expanded);
  };

  ngOnInit(): void {
    this.userName.set(this.authService.getUsernameFromToken() ?? '');
    window.addEventListener('sidebar-toggle', this.syncHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('sidebar-toggle', this.syncHandler);
  }

  protected toggleSidebar(): void {
    const newState = !this.sidebarExpanded();
    this.sidebarExpanded.set(newState);
    window.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { expanded: newState }
    }));
  }

  protected logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
