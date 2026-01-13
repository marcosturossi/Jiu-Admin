import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoticesService } from '../../../generated_services/api/notices.service';
import { ShowNoticesDTO } from '../../../generated_services/model/showNoticesDTO';
import { CreateNoticeComponent } from './create-notice/create-notice.component';
import { UpdateNoticeComponent } from './update-notice/update-notice.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notices',
  imports: [CommonModule, CreateNoticeComponent, UpdateNoticeComponent, DatePipe],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss'
})
export class NoticesComponent implements OnInit {
  notices: ShowNoticesDTO[] = [];
  isLoading: boolean = false;
  openedCreateNotice: boolean = false;
  selectedNotice!: ShowNoticesDTO;
  openedUpdateNotice: boolean = false;

  constructor(
    private noticesService: NoticesService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Avisos");
    this.loadNotices();
  }

  loadNotices(): void {
    this.isLoading = true;
    this.noticesService.apiNoticesGet().subscribe(
      {
        next: (result) => {
          this.notices = result;
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          this.notificationService.showError(
            'Erro ao Carregar Avisos!', 
            'Não foi possível carregar a lista de avisos. Tente novamente.'
          );
        }
      }
    )
  }

  openCreateNotice() {
    this.openedCreateNotice = true
  }

  closeCreateNotice() {
    this.openedCreateNotice = false
  }

  openUpdateNotice(notice: ShowNoticesDTO) {
    this.selectedNotice = notice
    this.openedUpdateNotice = true
  }

  closeUpdateNotice() {
    this.openedUpdateNotice = false
  }

  onNoticeCreated() {
    this.loadNotices();
    this.closeCreateNotice();
  }

  onNoticeUpdated() {
    this.loadNotices();
    this.closeUpdateNotice();
  }

  deleteNotice(notice: ShowNoticesDTO) {
    if (confirm(`Tem certeza que deseja excluir o aviso "${notice.description}"?`)) {
      this.noticesService.apiNoticesIdDelete(notice.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Aviso Excluído!', 
            'O aviso foi excluído com sucesso.'
          );
          this.loadNotices();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir Aviso!', 
            'Não foi possível excluir o aviso. Tente novamente.'
          );
        }
      });
    }
  }
}
