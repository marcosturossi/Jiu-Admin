import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {SubnavComponent} from "../../../shared/subnav/subnav.component";
import {SubnavService} from "../../../services/subnav.service";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    imports: [SubnavComponent],
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private subnavService: SubnavService) {
  }

  ngOnInit(): void {
    this.subnavService.setTitle("Home");
  }

}
