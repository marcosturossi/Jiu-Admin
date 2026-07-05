import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';

import { StudentsService } from '../../../../generated_services/api/students.service';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import {
  ShowStudentDTO,
  PaginatedResultOfShowContractDTO,
  PaginatedResultOfShowGraduationDTO,
} from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { SubnavService } from '../../../../services/subnav.service';
import { UpdateStudentComponent } from '../update-student/update-student.component';

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
        if (s.id) {
          this.studentsService.apiStudentsIdPhotoUrlGet(s.id).subscribe({
            next: (res: { url: string }) => this.photoUrl.set(res?.url ?? null),
            error: () => this.photoUrl.set(null),
          });
        }
        this.isLoadingStudent.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro', 'Não foi possível carregar o aluno.');
        this.isLoadingStudent.set(false);
      },
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
    switch (status) {
      case 'Active':      return 'bg-success';
      case 'Inactive':    return 'bg-secondary';
      case 'Suspended':   return 'bg-warning text-dark';
      default:            return 'bg-danger';
    }
  }

  protected contractStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      Active:      'Ativo',
      Inactive:    'Inativo',
      Suspended:   'Suspenso',
      Terminated:  'Encerrado',
      Cancelled:   'Cancelado',
      Expired:     'Expirado',
    };
    return map[status ?? ''] ?? status ?? '';
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
