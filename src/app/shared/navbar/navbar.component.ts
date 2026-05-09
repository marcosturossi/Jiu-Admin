import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Keycloak from 'keycloak-js';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthServiceService } from '../../services/auth-service.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  private readonly keycloak       = inject(Keycloak);
  private readonly authService    = inject(AuthServiceService);
  protected readonly themeService = inject(ThemeService);

  protected readonly userName        = signal<string>('');
  protected readonly sidebarExpanded = signal(false);

  ngOnInit(): void {
    this.userName.set(this.authService.getUsernameFromToken() ?? '');
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
