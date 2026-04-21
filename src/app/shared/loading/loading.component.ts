import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  template: `
    <div class="loading-overlay">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {}
