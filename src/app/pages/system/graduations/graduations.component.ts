import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { PaginationGraduationDTO, ShowGraduationDTO } from '../../../generated_services';
import { UpdateGraduationComponent } from './update-graduation/update-graduation.component';
import { CreateGraduationComponent } from './create-graduation/create-graduation.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-graduations',
  imports: [CommonModule, UpdateGraduationComponent, CreateGraduationComponent, PaginationComponent],
  templateUrl: './graduations.component.html',
  styleUrl: './graduations.component.scss'
})
export class GraduationsComponent implements OnInit {
  graduations: PaginationGraduationDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  openedCreateGraduation: boolean = false
  openedUpdateGraduation: boolean = false
  selectedGraduation!: ShowGraduationDTO;

  constructor(
    private graduationService: GraduationService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) {

  }

  ngOnInit(): void {
    this.subnavService.setTitle("Graduações");
    this.loadGraduations();
  }

  loadGraduations(): void {
    this.isLoading = true;
    this.graduationService.apiGraduationGet(this.currentPage, this.pageSize).subscribe(
      {
        next: (result) => {
          this.graduations = result;
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          this.notificationService.showError(
            'Erro ao Carregar Graduações!', 
            'Não foi possível carregar a lista de graduações. Tente novamente.'
          );
        }
      }
    )
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadGraduations();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadGraduations();
  }

  openCreateGraduation() {
    this.openedCreateGraduation = true
  }

  closeCreateGraduation() {
    this.openedCreateGraduation = false
    this.loadGraduations(); // Reload data
  }

  openUpdateGraduation(graduation: ShowGraduationDTO) {
    this.selectedGraduation = graduation
    this.openedUpdateGraduation = true
  }

  closeUpdateGraduation() {
    this.openedUpdateGraduation = false
    this.loadGraduations(); // Reload data
  }

  onGraduationCreated() {
    this.loadGraduations();
    this.closeCreateGraduation();
  }

  onGraduationUpdated() {
    this.loadGraduations();
    this.closeUpdateGraduation();
  }

  deleteGraduation(graduation: ShowGraduationDTO) {
    if (confirm('Tem certeza que deseja excluir esta graduação?')) {
      this.graduationService.apiGraduationIdDelete(graduation.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Graduação Excluída!', 
            'A graduação foi excluída com sucesso.'
          );
          this.loadGraduations();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir Graduação!', 
            'Não foi possível excluir a graduação. Tente novamente.'
          );
        }
      });
    }
  }
}
