import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { StudentsService } from '../../../../generated_services/api/students.service';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { AccountsReceivableService } from '../../../../generated_services/api/accountsReceivable.service';
import {
  ShowStudentDTO,
  PaginatedResultOfShowContractDTO,
  PaginatedResultOfShowGraduationDTO,
  PaginatedResultOfShowAccountsReceivableDTO,
  ShowAccountsReceivableDTO,
} from '../../../../generated_services';
import { TransactionType } from '../../../../generated_services/model/transactionType';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { SubnavService } from '../../../../services/subnav.service';
import { UpdateStudentComponent } from '../update-student/update-student.component';
import { contractStatusBadge as getContractStatusBadge, feeStatusBadge as getFeeStatusBadge } from '../../../../shared/status-badge';
import { GenerateChargeComponent } from '../../accounts-receivable/generate-charge/generate-charge.component';
import { ViewChargeComponent } from '../../accounts-receivable/view-charge/view-charge.component';
import { PaymentWithMoneyComponent } from '../../accounts-receivable/payment-with-money/payment-with-money.component';

@Component({
  selector: 'app-detail-student',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, UpdateStudentComponent, GenerateChargeComponent, ViewChargeComponent, PaymentWithMoneyComponent],
  templateUrl: './detail-student.component.html',
  styleUrl: './detail-student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailStudentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly studentsService = inject(StudentsService);
  private readonly contractService = inject(ContractService);
  private readonly graduationService = inject(GraduationService);
  private readonly accountsReceivableService = inject(AccountsReceivableService);
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly student = signal<ShowStudentDTO | null>(null);
  protected readonly contracts = signal<PaginatedResultOfShowContractDTO | null>(null);
  protected readonly graduations = signal<PaginatedResultOfShowGraduationDTO | null>(null);
  protected readonly fees = signal<PaginatedResultOfShowAccountsReceivableDTO | null>(null);
  protected readonly isLoadingStudent = signal(false);
  protected readonly isLoadingContracts = signal(false);
  protected readonly isLoadingGraduations = signal(false);
  protected readonly isLoadingFees = signal(false);
  protected readonly photoUrl = signal<string | null>(null);
  protected readonly openedUpdate = signal(false);

  protected readonly openedGenerateCharge = signal(false);
  protected readonly openedViewCharge = signal(false);
  protected readonly openedPaymentWithMoney = signal(false);
  protected readonly selectedFee = signal<ShowAccountsReceivableDTO | null>(null);

  protected readonly openedPhotoEditor = signal(false);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly selectedPhotoFile = signal<File | null>(null);
  protected readonly isUploadingPhoto = signal(false);
  protected readonly isRemovingPhoto = signal(false);

  ngOnInit(): void {
    this.subnavService.setTitle('Detalhes do Aluno');
    this.loadStudent();
    this.loadContracts();
    this.loadGraduations();
    this.loadFees();
  }

  protected loadStudent(): void {
    this.isLoadingStudent.set(true);
    this.studentsService.apiStudentsIdGet(this.id).subscribe({
      next: (s) => {
        this.student.set(s);
        this.loadPhoto();
        this.isLoadingStudent.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro', 'Não foi possível carregar o aluno.');
        this.isLoadingStudent.set(false);
      },
    });
  }

  private loadPhoto(): void {
    const studentId = this.student()?.id;
    if (!studentId) { this.photoUrl.set(null); return; }
    const basePath = this.studentsService.configuration.basePath;
    this.http.get(`${basePath}/api/Students/${studentId}/photo`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onload = e => this.photoUrl.set(e.target?.result as string);
        reader.readAsDataURL(blob);
      },
      error: () => this.photoUrl.set(null),
    });
  }

  protected openPhotoEditor(): void {
    this.openedPhotoEditor.set(true);
  }

  protected closePhotoEditor(): void {
    this.openedPhotoEditor.set(false);
    this.cancelPhotoSelection();
  }

  protected onPhotoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.notificationService.showError('Arquivo Inválido', 'Por favor, selecione apenas arquivos de imagem.');
      this.cancelPhotoSelection();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.showError('Arquivo Muito Grande', 'A foto deve ter no máximo 5MB.');
      this.cancelPhotoSelection();
      return;
    }
    this.selectedPhotoFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected cancelPhotoSelection(): void {
    this.selectedPhotoFile.set(null);
    this.photoPreview.set(null);
    const input = document.getElementById('photoInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  protected uploadPhoto(): void {
    const file = this.selectedPhotoFile();
    const studentId = this.student()?.id;
    if (!file || !studentId || this.isUploadingPhoto()) return;
    this.isUploadingPhoto.set(true);
    this.studentsService.apiStudentsIdPhotoPost(studentId, file).subscribe({
      next: () => {
        this.notificationService.showSuccess('Foto Atualizada!', 'A foto do aluno foi atualizada com sucesso.');
        this.cancelPhotoSelection();
        this.loadPhoto();
        this.openedPhotoEditor.set(false);
      },
      error: (err) => this.notificationService.showError('Erro ao Enviar Foto', extractErrorMessage(err, 'Não foi possível atualizar a foto do aluno. Tente novamente.')),
      complete: () => this.isUploadingPhoto.set(false),
    });
  }

  protected removePhoto(): void {
    const studentId = this.student()?.id;
    if (!studentId || this.isRemovingPhoto()) return;
    this.isRemovingPhoto.set(true);
    this.studentsService.apiStudentsIdPhotoDelete(studentId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Foto Removida!', 'A foto do aluno foi removida com sucesso.');
        this.photoUrl.set(null);
        this.openedPhotoEditor.set(false);
      },
      error: (err) => this.notificationService.showError('Erro ao Remover Foto', extractErrorMessage(err, 'Não foi possível remover a foto do aluno. Tente novamente.')),
      complete: () => this.isRemovingPhoto.set(false),
    });
  }

  protected loadContracts(): void {
    this.isLoadingContracts.set(true);
    this.contractService
      .apiContractGet(undefined, this.id, undefined, undefined, undefined, undefined, undefined, 1, 50)
      .subscribe({
        next: (data) => {
          this.contracts.set(data);
          this.isLoadingContracts.set(false);
        },
        error: () => {
          this.notificationService.showError('Erro', 'Não foi possível carregar os contratos.');
          this.isLoadingContracts.set(false);
        },
      });
  }

  protected loadGraduations(): void {
    this.isLoadingGraduations.set(true);
    this.graduationService
      .apiGraduationGet(this.id, undefined, undefined, undefined, 1, 50, undefined, true)
      .subscribe({
        next: (data) => {
          this.graduations.set(data);
          this.isLoadingGraduations.set(false);
        },
        error: () => {
          this.notificationService.showError('Erro', 'Não foi possível carregar as graduações.');
          this.isLoadingGraduations.set(false);
        },
      });
  }

  protected loadFees(): void {
    this.isLoadingFees.set(true);
    this.accountsReceivableService
      .apiAccountsReceivableStudentStudentIdGet(this.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 50)
      .subscribe({
        next: (data) => {
          this.fees.set(data);
          this.isLoadingFees.set(false);
        },
        error: () => {
          this.notificationService.showError('Erro', 'Não foi possível carregar as contas a receber do aluno.');
          this.isLoadingFees.set(false);
        },
      });
  }

  protected feeStatusBadge(status: string | undefined): string {
    return getFeeStatusBadge(status).cssClass;
  }

  protected feeStatusLabel(status: string | undefined): string {
    return getFeeStatusBadge(status).label;
  }

  protected isChargeable(fee: ShowAccountsReceivableDTO): boolean {
    // Mirrors AccountsReceivableComponent.isChargeable — same client-side guard against
    // re-charging an already-charged transaction (see that component for the full rationale).
    return fee.status === 'Pending'
      && (fee.type === TransactionType.Income || fee.type === TransactionType.Adjustment)
      && fee.externalChargeId == null;
  }

  protected openGenerateCharge(fee: ShowAccountsReceivableDTO): void {
    this.selectedFee.set(fee);
    this.openedGenerateCharge.set(true);
  }

  protected closeGenerateCharge(): void {
    this.openedGenerateCharge.set(false);
    this.selectedFee.set(null);
  }

  protected onChargeGenerated(): void {
    this.loadFees();
  }

  protected openViewCharge(fee: ShowAccountsReceivableDTO): void {
    this.selectedFee.set(fee);
    this.openedViewCharge.set(true);
  }

  protected closeViewCharge(): void {
    this.openedViewCharge.set(false);
    this.selectedFee.set(null);
  }

  protected openPaymentWithMoney(fee: ShowAccountsReceivableDTO): void {
    this.selectedFee.set(fee);
    this.openedPaymentWithMoney.set(true);
  }

  protected onPaymentWithMoney(): void {
    this.openedPaymentWithMoney.set(false);
    this.selectedFee.set(null);
    this.loadFees();
  }

  protected closePaymentWithMoney(): void {
    this.openedPaymentWithMoney.set(false);
    this.selectedFee.set(null);
  }

  protected openUpdate(): void {
    this.openedUpdate.set(true);
  }

  protected goBack(): void {
    this.router.navigate(['/system/students']);
  }

  protected onStudentUpdated(): void {
    this.openedUpdate.set(false);
    this.loadStudent();
  }

  protected contractStatusBadge(status: string | undefined): string {
    return getContractStatusBadge(status).cssClass;
  }

  protected contractStatusLabel(status: string | undefined): string {
    return getContractStatusBadge(status).label;
  }

  protected stripesLabel(stripes: string | undefined): string {
    const map: Record<string, string> = {
      None:  '0 listras',
      One:   '1 listra',
      Two:   '2 listras',
      Three: '3 listras',
      Four:  '4 listras',
    };
    return map[stripes ?? ''] ?? '0 listras';
  }

  protected relationshipLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      Mother:       'Mãe',
      Father:       'Pai',
      LegalGuardian:'Responsável Legal',
    };
    return map[type ?? ''] ?? type ?? '';
  }

  protected addressTypeLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      Comercial:   'Comercial',
      Residential: 'Residencial',
    };
    return map[type ?? ''] ?? 'Não informado';
  }
}
