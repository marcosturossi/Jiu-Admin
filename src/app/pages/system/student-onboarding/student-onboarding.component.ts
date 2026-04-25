import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { OnboardingBasicFormComponent } from './onboarding-basic-form.component';
import { OnboardingBeltFormComponent } from './onboarding-belt-form.component';
import { OnboardingContractFormComponent } from './onboarding-contract-form.component';
import { OnboardingConfirmationComponent } from './onboarding-confirmation.component';

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
  graduationId: string;
  startDate: string;
}

export interface StudentContractInfo {
  contractId: string;
  feePlanId: string;
  startDate: string;
}

export interface StudentMedicalInfo {
  hasRestrictions: boolean;
  restrictions: string;
  medicalClearanceUrl: string;
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

  protected readonly currentStep = signal<number>(1);
  protected readonly maxSteps = 4;

  protected readonly basicInfo = signal<StudentBasicInfo>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  protected readonly beltInfo = signal<StudentBeltInfo>({
    beltId: '',
    graduationId: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  protected readonly contractInfo = signal<StudentContractInfo>({
    contractId: '',
    feePlanId: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  protected readonly medicalInfo = signal<StudentMedicalInfo>({
    hasRestrictions: false,
    restrictions: '',
    medicalClearanceUrl: '',
  });

  ngOnInit(): void {
    this.subnavService.setTitle('Cadastro de Alunos');
  }

  protected nextStep(): void {
    if (this.currentStep() < this.maxSteps) {
      this.currentStep.update(step => step + 1);
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  protected async submitForm(): Promise<void> {
    // TODO: Implement API call to submit all wizard data
    console.log('Submitting:', {
      basicInfo: this.basicInfo(),
      beltInfo: this.beltInfo(),
      contractInfo: this.contractInfo(),
      medicalInfo: this.medicalInfo(),
    });
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

  protected getStepProgress(): number {
    return (this.currentStep() / this.maxSteps) * 100;
  }
}
