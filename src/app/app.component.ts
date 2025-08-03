import {Component, OnDestroy} from '@angular/core';
import {NotificationService} from "./services/notification.service";
import {Subscription} from "rxjs";
import {NotificationInterface} from "./shared/interface/notification";
import {RouterModule, RouterOutlet} from "@angular/router";
import {ToastComponent} from "./shared/toast/toast.component";
import {CommonModule} from "@angular/common";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [RouterOutlet, ToastComponent, CommonModule, RouterModule],
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  title = 'PixelDashboard';
  notification = false;
  notificationData!: NotificationInterface
  subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {
    this.subscriptions.push(this.notificationService.notificationEvent.subscribe(
      result => {
        this.notificationData = result
        this.notification = true
      }
    ))

    this.subscriptions.push(this.notificationService.closeNotificationEvent.subscribe(
      () => this.notification = false
    ))
  }

  ngOnDestroy() {
    this.subscriptions.map(subscription => subscription.unsubscribe())
  }
}
