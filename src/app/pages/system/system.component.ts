import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SubnavComponent } from '../../shared/subnav/subnav.component';

@Component({
    selector: 'app-system',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, NavbarComponent, SubnavComponent],
    templateUrl: './system.component.html',
    styleUrl: './system.component.scss',
})
export class SystemComponent {

}
