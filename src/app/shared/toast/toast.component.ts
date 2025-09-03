import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationInterface } from '../interface/notification';
import { NotificationService } from '../../services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() notification!: NotificationInterface;
  
  private timeoutId?: number;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Set auto-close timer if duration is specified
    if (this.notification.duration && this.notification.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.close();
      }, this.notification.duration);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close() {
    if (this.notification.id) {
      this.notificationService.removeNotification(this.notification.id);
    }
  }

  getToastClasses(): string {
    const baseClasses = 'toast show';
    const typeClasses = {
      success: 'border-success',
      error: 'border-danger', 
      warning: 'border-warning',
      info: 'border-info'
    };
    
    return `${baseClasses} ${typeClasses[this.notification.type]}`;
  }

  getIconClass(): string {
    const iconClasses = {
      success: 'bi bi-check-circle-fill text-success',
      error: 'bi bi-x-circle-fill text-danger',
      warning: 'bi bi-exclamation-triangle-fill text-warning',
      info: 'bi bi-info-circle-fill text-info'
    };
    
    return iconClasses[this.notification.type];
  }

  getHeaderBgClass(): string {
    const bgClasses = {
      success: 'bg-success-subtle',
      error: 'bg-danger-subtle',
      warning: 'bg-warning-subtle',
      info: 'bg-info-subtle'
    };
    
    return bgClasses[this.notification.type];
  }
}
