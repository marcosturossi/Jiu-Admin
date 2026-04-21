import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, CommonModule, RouterModule],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'CarlsonGracieAdm';
}
