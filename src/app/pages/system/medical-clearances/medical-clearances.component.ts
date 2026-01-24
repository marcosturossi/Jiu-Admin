import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { ShowMedicalClearanceDTO } from '../../../generated_services/model/showMedicalClearanceDTO';
import { CreateMedicalClearanceComponent } from './create-medical-clearance/create-medical-clearance.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationMedicalClearanceDTO } from '../../../generated_services';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { BlobViewerComponent } from '../../../shared/blob-viewer/blob-viewer.component';

@Component({
  selector: 'app-medical-clearances',
  imports: [CommonModule, CreateMedicalClearanceComponent, PaginationComponent, BlobViewerComponent],
  providers: [DatePipe],
  templateUrl: './medical-clearances.component.html',
  styleUrl: './medical-clearances.component.scss'
})
export class MedicalClearancesComponent implements OnInit {
  medicalClearances: PaginationMedicalClearanceDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  openedCreateMedicalClearance: boolean = false;
  selectedMedicalClearance!: ShowMedicalClearanceDTO;
  currentPage: number = 1;
  pageSize: number = 10;
  selectedAttachmentBlob?: Blob;
  selectedAttachmentMimeType?: string;

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


  onMedicalClearanceCreated() {
    this.loadMedicalClearances();
    this.closeCreateMedicalClearance();
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

  openAttachment(clearance: ShowMedicalClearanceDTO) {
    if (!clearance.id) return;
    this.isLoading = true;
    this.medicalClearanceService.apiMedicalClearanceIdAttachmentGet(
      clearance.id,
      'body',
      false,
      { httpHeaderAccept: 'application/octet-stream' }
    ).subscribe({
      next: (blob: Blob) => {
        const mime = clearance.attachmentContentType || 'application/pdf';
        // Ensure the blob has the correct MIME type so the browser can render it instead of forcing download
        this.selectedAttachmentBlob = blob.type === mime ? blob : new Blob([blob], { type: mime });
        this.selectedAttachmentMimeType = mime;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.log(error);
        this.notificationService.showError('Erro ao carregar arquivo', 'Não foi possível carregar o arquivo do atestado.');
      }
    });
  }

  closeAttachmentViewer() {
    this.selectedAttachmentBlob = undefined;
    this.selectedAttachmentMimeType = undefined;
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

  getClearanceId(clearance: ShowMedicalClearanceDTO): string {
    return clearance.id ? clearance.id : '';
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
