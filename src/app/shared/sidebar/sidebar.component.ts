import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { NAV_SECTIONS, NavItem, NavSection } from '../nav-config';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthServiceService);
  protected readonly sidebarExpanded = signal(false);
  protected readonly openSections = signal<Set<string>>(new Set());

  protected readonly sections: NavSection[] = NAV_SECTIONS;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => this.initOpenSections());
  }

  private toggleHandler = (event: Event) => {
    const customEvent = event as CustomEvent;
    this.sidebarExpanded.set(customEvent.detail.expanded);
  };

  ngOnInit(): void {
    window.addEventListener('sidebar-toggle', this.toggleHandler);
    this.initOpenSections();
  }

  ngOnDestroy(): void {
    window.removeEventListener('sidebar-toggle', this.toggleHandler);
  }

  private initOpenSections(): void {
    const url = this.router.url;
    const active = this.sections.find(s => s.items.some(i => url.startsWith(i.route)));
    this.openSections.update(current => {
      const next = new Set(current);
      next.add(active ? active.title : 'Principal');
      return next;
    });
  }

  protected isSectionOpen(title: string): boolean {
    return this.openSections().has(title);
  }

  protected toggleSection(title: string): void {
    this.openSections.update(set => {
      const next = new Set(set);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  protected isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  protected isVisible(item: NavItem): boolean {
    return !item.adminOnly || this.authService.isTenantAdmin();
  }

  protected navigate(route: string): void {
    this.router.navigate([route]);
  }
}

