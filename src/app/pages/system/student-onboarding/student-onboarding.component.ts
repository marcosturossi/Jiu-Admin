import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { StudentsService } from '../../../generated_services/api/students.service';
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
  private readonly studentsService = inject(StudentsService);

  protected readonly currentStep = signal<number>(1);
  protected readonly maxSteps = 4;
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

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
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    try {
      const basic = this.basicInfo();
      
      // Prepare student data for API
      const createStudentDTO = {
        userName: basic.email.split('@')[0], // Use email prefix as username
        email: basic.email,
        phoneNumber: basic.phone,
        firstName: basic.name.split(' ')[0],
        lastName: basic.name.split(' ').slice(1).join(' '),
        birthDay: basic.dateOfBirth,
      };
      
      // Call API to create student
      await this.studentsService.apiStudentsPost(createStudentDTO).toPromise();
      
      this.successMessage.set('Aluno cadastrado com sucesso!');
      setTimeout(() => {
        this.resetForm();
      }, 2000);
    } catch (error) {
      let errorMsg = 'Erro ao cadastrar aluno. Tente novamente.';
      
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.detail) {
          errorMsg = err.error.detail;
        } else if (err.statusText) {
          errorMsg = `Erro ${err.status}: ${err.statusText}`;
        }
      }
      
      this.errorMessage.set(errorMsg);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private resetForm(): void {
    this.currentStep.set(1);
    this.basicInfo.set({
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
    this.beltInfo.set({
      beltId: '',
      graduationId: '',
      startDate: new Date().toISOString().split('T')[0],
    });
    this.contractInfo.set({
      contractId: '',
      feePlanId: '',
      startDate: new Date().toISOString().split('T')[0],
    });
    this.medicalInfo.set({
      hasRestrictions: false,
      restrictions: '',
      medicalClearanceUrl: '',
    });
    this.successMessage.set(null);
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
