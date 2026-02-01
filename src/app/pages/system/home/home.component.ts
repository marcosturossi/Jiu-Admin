import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {SubnavComponent} from "../../../shared/subnav/subnav.component";
import {SubnavService} from "../../../services/subnav.service";
import {Subscription} from "rxjs";
import {NgxEchartsModule, provideEchartsCore} from 'ngx-echarts';
import {EChartsOption} from 'echarts';
import * as echarts from 'echarts';
import { TopStudentsComponent } from '../../../shared/dashboard-components/top-students/top-students.component';
import { AvgStudentsByBeltComponent } from '../../../shared/dashboard-components/avg-students-by-belt/avg-students-by-belt.component';
import { BirthdayThisMonthComponent } from '../../../shared/dashboard-components/birthday-this-month/birthday-this-month.component';
import { NewStudentsThisMonthComponent } from "../../../shared/dashboard-components/new-students-this-month/new-students-this-month.component";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    imports: [SubnavComponent, NgxEchartsModule, TopStudentsComponent, BirthdayThisMonthComponent, NewStudentsThisMonthComponent, NewStudentsThisMonthComponent],
    providers: [provideEchartsCore({ echarts })],
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private subnavService: SubnavService) {
  }

  ngOnInit(): void {
    this.subnavService.setTitle("Home");
  }

}
