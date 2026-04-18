import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    <div class="loading-overlay">
      <p-progressSpinner
        strokeWidth="3"
        animationDuration="0.8s"
      />
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
