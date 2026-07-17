import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, CommonModule, RouterModule, ConfirmDialogComponent],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'CarlsonGracieAdm';
}
