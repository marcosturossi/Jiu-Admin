import {EventEmitter, Injectable} from '@angular/core';
import {NotificationInterface} from "../shared/interface/notification";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notificationEvent: EventEmitter<NotificationInterface> = new EventEmitter<NotificationInterface>()
  closeNotificationEvent: EventEmitter<void> = new EventEmitter<void>()
  constructor() {}
}
