import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemComponent } from "./system.component";
import { RouterModule, RouterOutlet, Routes } from "@angular/router";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { FilterComponent } from "../../shared/filter/filter.component";
import { AuthGuard } from "../../guard/auth.guard";
import {NavbarComponent} from "../../shared/navbar/navbar.component";
import {HomeComponent} from "./home/home.component";
import {SubnavComponent} from "../../shared/subnav/subnav.component";
import { StudentsComponent } from './students/students.component';
import { LessonsComponent } from './lessons/lessons.component';
import { GraduationsComponent } from './graduations/graduations.component';
import { FrequenciesComponent } from './frequencies/frequencies.component';
import { BeltsComponent } from './belts/belts.component';
import { GraduationRequirementsComponent } from './graduation-requirements/graduation-requirements.component';
import { NoticesComponent } from './notices/notices.component';

export const routes: Routes = [
  {
    path: '',
    component: SystemComponent,  // Main layout component with <router-outlet>
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'home',  // Default redirect to HomeComponent
        pathMatch: 'full'
      },
      {
        path: 'students',
        pathMatch: 'full',
        component:StudentsComponent
      },
      {
        path: 'lessons',
        pathMatch: 'full',
        component: LessonsComponent
      },
      {
        path: 'graduations',
        pathMatch: 'full',
        component: GraduationsComponent
      },
      {
        path: 'frequencies',
        pathMatch: 'full',
        component: FrequenciesComponent
      },
      {
        path: 'belts',
        pathMatch: 'full',
        component: BeltsComponent
      },
      {
        path: 'graduation-requirements',
        pathMatch: 'full',
        component: GraduationRequirementsComponent
      },
      {
        path: 'notices',
        pathMatch: 'full',
        component: NoticesComponent,
      }
    ]
  }
];

@NgModule({
  declarations: [
    SystemComponent,
  ],
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule.forChild(routes), // Child routes setup
    SidebarComponent,
    NavbarComponent,
    FilterComponent,
    SubnavComponent,
  ],
  exports: [
    SystemComponent,
    RouterModule,
  ]
})
export class SystemModule { }
