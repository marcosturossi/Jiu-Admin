import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { ShowMedicalClearanceDTO } from '../../../generated_services/model/showMedicalClearanceDTO';
import { CreateMedicalClearanceComponent } from './create-medical-clearance/create-medical-clearance.component';
import { UpdateMedicalClearanceComponent } from './update-medical-clearance/update-medical-clearance.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationMedicalClearanceDTO } from '../../../generated_services';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-medical-clearances',
  imports: [CommonModule, CreateMedicalClearanceComponent, UpdateMedicalClearanceComponent, DatePipe, PaginationComponent],
  templateUrl: './medical-clearances.component.html',
  styleUrl: './medical-clearances.component.scss'
})
export class MedicalClearancesComponent implements OnInit {
  medicalClearances: PaginationMedicalClearanceDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  openedCreateMedicalClearance: boolean = false;
  selectedMedicalClearance!: ShowMedicalClearanceDTO;
  openedUpdateMedicalClearance: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private medicalClearanceService: MedicalClearanceService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Atestados Médicos");
    this.loadMedicalClearances();
  }

  loadMedicalClearances(): void {
    this.isLoading = true;
    this.medicalClearanceService.apiMedicalClearanceGet(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.medicalClearances = result;
        this.isLoading = false;
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
        this.notificationService.showError(
          'Erro de Carregamento', 
          'Não foi possível carregar a lista de atestados médicos.'
        );
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMedicalClearances();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadMedicalClearances();
  }

  openCreateMedicalClearance() {
    this.openedCreateMedicalClearance = true
  }

  closeCreateMedicalClearance() {
    this.openedCreateMedicalClearance = false
  }

  openUpdateMedicalClearance(medicalClearance: ShowMedicalClearanceDTO) {
    this.selectedMedicalClearance = medicalClearance
    this.openedUpdateMedicalClearance = true
  }

  closeUpdateMedicalClearance() {
    this.openedUpdateMedicalClearance = false
  }

  onMedicalClearanceCreated() {
    this.loadMedicalClearances();
    this.closeCreateMedicalClearance();
  }

  onMedicalClearanceUpdated() {
    this.loadMedicalClearances();
    this.closeUpdateMedicalClearance();
  }

  deleteMedicalClearance(medicalClearance: ShowMedicalClearanceDTO) {
    this.notificationService.showWarning(
      'Confirmação Necessária', 
      'Use o botão de confirmação no navegador para excluir o atestado médico.',
      6000
    );

    if (confirm('Tem certeza que deseja excluir este atestado médico?')) {
      this.medicalClearanceService.apiMedicalClearanceIdDelete(medicalClearance.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Atestado Excluído!', 
            'O atestado médico foi excluído com sucesso.'
          );
          this.loadMedicalClearances();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir!', 
            'Não foi possível excluir o atestado médico. Tente novamente.'
          );
        }
      });
    }
  }

  getStatusBadgeClass(status?: number): string {
    switch (status) {
      case 0: // Pending
        return 'bg-outline-warning text-warning';
      case 1: // Approved
        return 'bg-outline-success text-success';
      case 2: // Rejected
        return 'bg-outline-danger text-danger';
      case 3: // Expired
        return 'bg-outline-secondary text-secondary';
      case 4: // UnderReview
        return 'bg-outline-info text-info';
      default:
        return 'bg-outline-secondary text-secondary';
    }
  }

  getStatusLabel(status?: number): string {
    switch (status) {
      case 0:
        return 'Pendente';
      case 1:
        return 'Aprovado';
      case 2:
        return 'Rejeitado';
      case 3:
        return 'Expirado';
      case 4:
        return 'Em Análise';
      default:
        return 'Desconhecido';
    }
  }
}
