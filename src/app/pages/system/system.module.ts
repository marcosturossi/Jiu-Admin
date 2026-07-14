import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemComponent } from "./system.component";
import { RouterModule, RouterOutlet, Routes } from "@angular/router";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { FilterComponent } from "../../shared/filter/filter.component";
import { AuthGuard } from "../../guard/auth.guard";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { HomeComponent } from "./home/home.component";
import { SubnavComponent } from "../../shared/subnav/subnav.component";
import { StudentsComponent } from './students/students.component';
import { LessonsComponent } from './lessons/lessons.component';
import { GraduationsComponent } from './graduations/graduations.component';
import { FrequenciesComponent } from './frequencies/frequencies.component';
import { BeltsComponent } from './belts/belts.component';
import { GraduationRequirementsComponent } from './graduation-requirements/graduation-requirements.component';
import { NoticesComponent } from './notices/notices.component';
import { FaceRecognitionComponent } from './face-recognition/face-recognition.component';
import { NotificationComponent } from './notification/notification.component';
import { MedicalClearancesComponent } from './medical-clearances/medical-clearances.component';
import { FeePlansComponent } from './fee-plans/fee-plans.component';
import { ContractsComponent } from './contracts/contracts.component';
import { AccountsReceivableComponent } from './accounts-receivable/accounts-receivable.component';
import { AccountsPayableComponent } from './accounts-payable/accounts-payable.component';
import { TransactionCategoriesComponent } from './transaction-categories/transaction-categories.component';
import { AcademiesComponent } from './academies/academies.component';
import { StudentOnboardingComponent } from './student-onboarding/student-onboarding.component';
import { FinanceDashboardComponent } from './finance-dashboard/finance-dashboard.component';
import { SuppliersComponent } from './suppliers/suppliers.component';

export const routes: Routes = [
  {
    path: '',
    component: SystemComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      // Acadêmico
      { path: 'student-onboarding', component: StudentOnboardingComponent },
      { path: 'students', component: StudentsComponent},
  
      {path: 'students/details/:id', loadComponent: () => import('./students/detail-student/detail-student.component').then(m => m.DetailStudentComponent)},

      { path: 'lessons', component: LessonsComponent },
      { path: 'graduations', component: GraduationsComponent },
      { path: 'frequencies', component: FrequenciesComponent },
      { path: 'belts', component: BeltsComponent },
      { path: 'graduation-requirements', component: GraduationRequirementsComponent },
      // Comunicação
      { path: 'notices', component: NoticesComponent },
      { path: 'notification', component: NotificationComponent },
      // Financeiro
      { path: 'finance-dashboard', component: FinanceDashboardComponent },
      { path: 'fee-plans', component: FeePlansComponent },
      { path: 'contracts', component: ContractsComponent },
      { path: 'accounts-receivable', component: AccountsReceivableComponent },
      { path: 'accounts-payable', component: AccountsPayableComponent },
      { path: 'transaction-categories', component: TransactionCategoriesComponent },
      // Saúde e Segurança
      { path: 'medical-clearances', component: MedicalClearancesComponent },
      { path: 'face-recognition', component: FaceRecognitionComponent },
      // Fornecedores
      { path: 'suppliers', component: SuppliersComponent },
      { path: 'suppliers/details/:id', loadComponent: () => import('./suppliers/detail-supplier/detail-supplier.component').then(m => m.DetailSupplierComponent) },
      // Configurações
      { path: 'academies', component: AcademiesComponent },
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
    RouterModule.forChild(routes),
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
