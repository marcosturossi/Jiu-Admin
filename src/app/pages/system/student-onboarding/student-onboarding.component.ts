import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { BeltService } from '../../../generated_services/api/belt.service';
import { FeePlanService } from '../../../generated_services/api/feePlan.service';
import { ContractService } from '../../../generated_services/api/contract.service';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';
import { ShowFeePlanDTO } from '../../../generated_services/model/showFeePlanDTO';
import { OnboardingBasicFormComponent } from './onboarding-basic-form.component';
import { OnboardingBeltFormComponent } from './onboarding-belt-form.component';
import { OnboardingContractFormComponent } from './onboarding-contract-form.component';
import { OnboardingConfirmationComponent } from './onboarding-confirmation.component';
import { todayDateString } from '../../../utils/date.utils';
import { extractErrorMessage } from '../../../utils/error.utils';

export interface StudentBasicInfo {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface StudentBeltInfo {
  beltId: string;
  startDate: string;
}

export interface StudentContractInfo {
  feePlanId: string;
  startDate: string;
}

export interface StudentMedicalInfo {
  hasClearance: boolean;
  expiresAt: string;
  isApproved: boolean;
  clearanceFile: File | null;
}

function emptyBasicInfo(): StudentBasicInfo {
  return { name: '', email: '', phone: '', cpf: '', dateOfBirth: '', gender: '', address: '', city: '', state: '', zipCode: '' };
}

function emptyBeltInfo(): StudentBeltInfo {
  return { beltId: '', startDate: todayDateString() };
}

function emptyContractInfo(): StudentContractInfo {
  return { feePlanId: '', startDate: todayDateString() };
}

function emptyMedicalInfo(): StudentMedicalInfo {
  return { hasClearance: false, expiresAt: '', isApproved: false, clearanceFile: null };
}

@Component({
  selector: 'app-student-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    OnboardingBasicFormComponent,
    OnboardingBeltFormComponent,
    OnboardingContractFormComponent,
    OnboardingConfirmationComponent,
  ],
  templateUrl: './student-onboarding.component.html',
  styleUrl: './student-onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentOnboardingComponent implements OnInit {
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly studentsService = inject(StudentsService);
  private readonly beltService = inject(BeltService);
  private readonly feePlanService = inject(FeePlanService);
  private readonly contractService = inject(ContractService);
  private readonly graduationService = inject(GraduationService);
  private readonly medicalClearanceService = inject(MedicalClearanceService);
  private readonly router = inject(Router);

  protected readonly currentStep = signal<number>(1);
  protected readonly maxSteps = 4;
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly termsAccepted = signal<boolean>(false);

  protected readonly belts = signal<ShowBeltDTO[]>([]);
  protected readonly feePlans = signal<ShowFeePlanDTO[]>([]);

  protected readonly basicInfo = signal<StudentBasicInfo>(emptyBasicInfo());
  protected readonly beltInfo = signal<StudentBeltInfo>(emptyBeltInfo());
  protected readonly contractInfo = signal<StudentContractInfo>(emptyContractInfo());
  protected readonly medicalInfo = signal<StudentMedicalInfo>(emptyMedicalInfo());

  ngOnInit(): void {
    this.subnavService.setTitle('Cadastro de Alunos');
    this.beltService.apiBeltGet(undefined, undefined, undefined, undefined, 1, 100).subscribe({ next: r => this.belts.set(r?.items ?? []) });
    this.feePlanService.apiFeePlanGet(undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({ next: r => this.feePlans.set(r?.items ?? []) });
  }

  protected nextStep(): void {
    if (this.currentStep() < this.maxSteps) {
      this.currentStep.update(step => step + 1);
      this.errorMessage.set(null);
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
      this.errorMessage.set(null);
    }
  }

  protected async submitForm(): Promise<void> {
    if (!this.termsAccepted()) {
      this.errorMessage.set('Confirme que os dados estão corretos para prosseguir.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const basic = this.basicInfo();
    const belt = this.beltInfo();
    const contract = this.contractInfo();
    const medical = this.medicalInfo();

    let studentId: string;
    try {
      const created = await firstValueFrom(this.studentsService.apiStudentsPost({
        userName: basic.email.split('@')[0],
        email: basic.email,
        phoneNumber: basic.phone || null,
        cpf: basic.cpf,
        firstName: basic.name.split(' ')[0],
        lastName: basic.name.split(' ').slice(1).join(' '),
        birthDay: basic.dateOfBirth,
      }));
      studentId = created.id!;
    } catch (error) {
      this.errorMessage.set(extractErrorMessage(error, 'Erro ao cadastrar aluno. Tente novamente.'));
      this.isSubmitting.set(false);
      return;
    }

    const followUpIssues: string[] = [];

    if (belt.beltId) {
      try {
        await firstValueFrom(this.graduationService.apiGraduationPost({
          studentId,
          beltId: belt.beltId,
          graduationDate: belt.startDate || todayDateString(),
        }));
      } catch (error) {
        followUpIssues.push(`Faixa não registrada (${extractErrorMessage(error, 'erro desconhecido')}) — registre em Graduações.`);
      }
    }

    if (contract.feePlanId) {
      try {
        await firstValueFrom(this.contractService.apiContractPost({
          personId: studentId,
          feePlanId: contract.feePlanId,
          startDate: contract.startDate || todayDateString(),
        }));
      } catch (error) {
        followUpIssues.push(`Contrato não criado (${extractErrorMessage(error, 'erro desconhecido')}) — crie manualmente em Contratos.`);
      }
    }

    if (medical.hasClearance) {
      try {
        const clearance = await firstValueFrom(this.medicalClearanceService.apiMedicalClearancePost({
          studentId,
          expiresAt: medical.expiresAt || undefined,
          isApproved: medical.isApproved,
          isActive: true,
        }));
        if (medical.clearanceFile && clearance.id) {
          try {
            await firstValueFrom(this.medicalClearanceService.apiMedicalClearanceIdAttachmentPost(clearance.id, medical.clearanceFile));
          } catch (error) {
            followUpIssues.push(`Atestado criado, mas o arquivo não foi anexado (${extractErrorMessage(error, 'erro desconhecido')}) — anexe manualmente em Atestados Médicos.`);
          }
        }
      } catch (error) {
        followUpIssues.push(`Atestado médico não registrado (${extractErrorMessage(error, 'erro desconhecido')}) — registre em Atestados Médicos.`);
      }
    }

    this.isSubmitting.set(false);

    if (followUpIssues.length > 0) {
      this.notificationService.showWarning('Aluno Cadastrado com Pendências', followUpIssues.join(' '));
    } else {
      this.notificationService.showSuccess('Aluno Cadastrado!', 'O aluno foi cadastrado com sucesso.');
    }

    this.resetForm();
    this.router.navigate(['/system/students/details', studentId]);
  }

  private resetForm(): void {
    this.currentStep.set(1);
    this.basicInfo.set(emptyBasicInfo());
    this.beltInfo.set(emptyBeltInfo());
    this.contractInfo.set(emptyContractInfo());
    this.medicalInfo.set(emptyMedicalInfo());
    this.termsAccepted.set(false);
  }

  protected updateBasicInfo(data: Partial<StudentBasicInfo>): void {
    this.basicInfo.update(info => ({ ...info, ...data }));
  }

  protected updateBeltInfo(data: Partial<StudentBeltInfo>): void {
    this.beltInfo.update(info => ({ ...info, ...data }));
  }

  protected updateContractInfo(data: Partial<StudentContractInfo>): void {
    this.contractInfo.update(info => ({ ...info, ...data }));
  }

  protected updateMedicalInfo(data: Partial<StudentMedicalInfo>): void {
    this.medicalInfo.update(info => ({ ...info, ...data }));
  }

  protected updateTermsAccepted(value: boolean): void {
    this.termsAccepted.set(value);
  }

  protected getStepProgress(): number {
    return (this.currentStep() / this.maxSteps) * 100;
  }
}
