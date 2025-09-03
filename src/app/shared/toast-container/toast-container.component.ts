import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { NotificationInterface } from '../interface/notification';
import { NotificationService } from '../../services/notification.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1055;">
      <app-toast 
        *ngFor="let notification of notifications; trackBy: trackByFn" 
        [notification]="notification">
      </app-toast>
    </div>
  `,
  imports: [CommonModule, ToastComponent],
  styles: [`
    .toast-container {
      max-height: 100vh;
      overflow-y: auto;
    }
    
    .toast-container app-toast {
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .toast-container app-toast:last-child {
      margin-bottom: 0;
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  notifications: NotificationInterface[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  trackByFn(index: number, item: NotificationInterface): string {
    return item.id || index.toString();
  }
}
