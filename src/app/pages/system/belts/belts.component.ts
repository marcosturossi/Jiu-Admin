import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeltService, ShowBeltDTO, PaginationBeltDTO } from '../../../generated_services';
import { CreateBeltComponent } from './create-belt/create-belt.component';
import { UpdateBeltComponent } from './update-belt/update-belt.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-belts',
  imports: [CommonModule, CreateBeltComponent, UpdateBeltComponent, PaginationComponent],
  templateUrl: './belts.component.html',
  styleUrl: './belts.component.scss'
})
export class BeltsComponent implements OnInit {
  belts: PaginationBeltDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  openedCreateBelt: boolean = false;
  selectedBelt!: ShowBeltDTO;
  openedUpdateBelt: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private beltService: BeltService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Faixas");
    this.loadBelts();
  }

  loadBelts(): void {
    this.isLoading = true;
    this.beltService.apiBeltGet(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.belts = result;
        this.isLoading = false;
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
        this.notificationService.showError(
          'Erro de Carregamento', 
          'Não foi possível carregar a lista de faixas.'
        );
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBelts();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadBelts();
  }

  openCreateBelt() {
    this.openedCreateBelt = true
  }

  closeCreateBelt() {
    this.openedCreateBelt = false
  }

  openUpdateBelt(belt: ShowBeltDTO) {
    this.selectedBelt = belt
    this.openedUpdateBelt = true
  }

  closeUpdateBelt() {
    this.openedUpdateBelt = false
  }

  onBeltCreated() {
    this.loadBelts();
    this.closeCreateBelt();
  }

  onBeltUpdated() {
    this.loadBelts();
    this.closeUpdateBelt();
  }

  deleteBelt(belt: ShowBeltDTO) {
    this.notificationService.showWarning(
      'Confirmação Necessária', 
      'Use o botão de confirmação no navegador para excluir a faixa.',
      6000
    );

    if (confirm('Tem certeza que deseja excluir esta faixa?')) {
      this.beltService.apiBeltIdDelete(belt.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Faixa Excluída!', 
            `A faixa ${belt.color} foi excluída com sucesso.`
          );
          this.loadBelts();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir!', 
            'Não foi possível excluir a faixa. Tente novamente.'
          );
        }
      });
    }
  }
}
