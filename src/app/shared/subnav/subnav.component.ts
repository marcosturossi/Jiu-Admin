import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SubnavService } from '../../services/subnav.service';

@Component({
  selector: 'app-subnav',
  standalone: true,
  imports: [],
  template: `
    <div class="page-header">
      <h4 class="page-title">{{ subnavService.title() }}</h4>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--p-text-color, #1a1f37);
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubnavComponent {
  protected readonly subnavService = inject(SubnavService);
}
