import {Component, Input} from '@angular/core';
import {NotificationInterface} from "../interface/notification";
import {NotificationService} from "../../services/notification.service";
import {CommonModule} from "@angular/common";

@Component({
    selector: 'app-toast',
    templateUrl: './toast.component.html',
    imports: [CommonModule],
    styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  @Input() notification!: NotificationInterface

  constructor(
    private notificationService:NotificationService
  ) {
    setTimeout(() => {this.close()}, 2000)
  }

  close(){
    this.notificationService.closeNotificationEvent.emit()
  }
}
