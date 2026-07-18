import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { SubnavService } from '../../services/subnav.service';
import { NAV_SECTIONS } from '../nav-config';

const NAV_ITEMS = NAV_SECTIONS.flatMap(section => section.items);

@Component({
  selector: 'app-subnav',
  standalone: true,
  imports: [],
  template: `
    <div class="page-header">
      @if (currentIcon()) {
        <span class="page-icon"><i [class]="currentIcon()"></i></span>
      }
      <h4 class="page-title">{{ subnavService.title() }}</h4>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--brand-border);
    }
    .page-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 8px;
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      color: var(--brand-primary);
      font-size: 1rem;
      flex-shrink: 0;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--brand-text);
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubnavComponent {
  protected readonly subnavService = inject(SubnavService);
  private readonly router = inject(Router);
  private readonly url = signal(this.router.url);

  protected readonly currentIcon = computed(() => {
    const url = this.url();
    return NAV_ITEMS.find(item => url.startsWith(item.route))?.icon ?? '';
  });

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => this.url.set(this.router.url));
  }
}
