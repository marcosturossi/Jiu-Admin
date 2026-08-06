import { NgModule } from '@angular/core';
import { SystemComponent } from "./system.component";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "../../guard/auth.guard";
import { HomeComponent } from "./home/home.component";
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
import { PaymentSettingsComponent } from './payment-settings/payment-settings.component';
import { AcademyProfileComponent } from './academy-profile/academy-profile.component';
import { ScheduledJobsComponent } from './scheduled-jobs/scheduled-jobs.component';
import { LessonSchedulesComponent } from './lesson-schedules/lesson-schedules.component';
import { ContractTermsTemplatesComponent } from './contract-terms-templates/contract-terms-templates.component';

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
      { path: 'lesson-schedules', component: LessonSchedulesComponent },
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
      { path: 'contract-terms-templates', component: ContractTermsTemplatesComponent },
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
      { path: 'academy-profile', component: AcademyProfileComponent },
      { path: 'payment-settings', component: PaymentSettingsComponent },
      { path: 'scheduled-jobs', component: ScheduledJobsComponent },
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule,
  ]
})
export class SystemModule { }
