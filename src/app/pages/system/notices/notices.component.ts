import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoticesService } from '../../../generated_services/api/notices.service';
import { ShowNoticesDTO } from '../../../generated_services/model/showNoticesDTO';
import { CreateNoticeComponent } from './create-notice/create-notice.component';
import { UpdateNoticeComponent } from './update-notice/update-notice.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';

@Component({
  selector: 'app-notices',
  imports: [CommonModule, CreateNoticeComponent, UpdateNoticeComponent, DatePipe],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss'
})
export class NoticesComponent implements OnInit {
  notices: ShowNoticesDTO[] = [];
  openedCreateNotice: boolean = false;
  selectedNotice!: ShowNoticesDTO;
  openedUpdateNotice: boolean = false;

  constructor(
    private noticesService: NoticesService,
    private subnavService: SubnavService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Avisos");
    this.loadNotices();
  }

  loadNotices(): void {
    this.noticesService.apiNoticesGet().subscribe(
      {
        next: (result) => this.notices = result
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
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
      this.noticesService.apiNoticesIdDelete(notice.id!).subscribe({
        next: () => {
          this.loadNotices();
        },
        error: (error) => console.log(error)
      });
    }
  }
}
