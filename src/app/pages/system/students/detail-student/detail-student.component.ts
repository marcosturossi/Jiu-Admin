import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { StudentsService } from '../../../../generated_services/api/students.service';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import {
  ShowStudentDTO,
  PaginatedResultOfShowContractDTO,
  PaginatedResultOfShowGraduationDTO,
} from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { SubnavService } from '../../../../services/subnav.service';
import { UpdateStudentComponent } from '../update-student/update-student.component';
import { contractStatusBadge as getContractStatusBadge } from '../../../../shared/status-badge';

@Component({
  selector: 'app-detail-student',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, UpdateStudentComponent],
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
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly student = signal<ShowStudentDTO | null>(null);
  protected readonly contracts = signal<PaginatedResultOfShowContractDTO | null>(null);
  protected readonly graduations = signal<PaginatedResultOfShowGraduationDTO | null>(null);
  protected readonly isLoadingStudent = signal(false);
  protected readonly isLoadingContracts = signal(false);
  protected readonly isLoadingGraduations = signal(false);
  protected readonly photoUrl = signal<string | null>(null);
  protected readonly openedUpdate = signal(false);

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
