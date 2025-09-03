import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, ToastContainerComponent, CommonModule, RouterModule],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'CarlsonGracieAdm';
}
