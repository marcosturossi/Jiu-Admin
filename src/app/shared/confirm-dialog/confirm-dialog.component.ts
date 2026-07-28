import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly confirmService = inject(ConfirmService);

  protected confirm(): void {
    this.confirmService.resolve(true);
  }

  protected cancel(): void {
    this.confirmService.resolve(false);
  }
}
