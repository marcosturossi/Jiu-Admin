import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    imports: [
        RouterLink
    ],
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
}
