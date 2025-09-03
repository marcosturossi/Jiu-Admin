import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationInterface } from '../shared/interface/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<NotificationInterface[]>([]);
  private idCounter = 0;

  constructor() {}

  // Get all notifications as observable
  getNotifications(): Observable<NotificationInterface[]> {
    return this.notifications$.asObservable();
  }

  // Show success notification
  showSuccess(title: string, message: string, duration: number = 4000): void {
    this.addNotification({
      title,
      message,
      type: 'success',
      duration,
      closable: true
    });
  }

  // Show error notification
  showError(title: string, message: string, duration: number = 5000): void {
    this.addNotification({
      title,
      message,
      type: 'error',
      duration,
      closable: true
    });
  }

  // Show warning notification
  showWarning(title: string, message: string, duration: number = 4000): void {
    this.addNotification({
      title,
      message,
      type: 'warning',
      duration,
      closable: true
    });
  }

  // Show info notification
  showInfo(title: string, message: string, duration: number = 3000): void {
    this.addNotification({
      title,
      message,
      type: 'info',
      duration,
      closable: true
    });
  }

  // Add notification to the list
  private addNotification(notification: NotificationInterface): void {
    const newNotification: NotificationInterface = {
      ...notification,
      id: this.generateId()
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, newNotification]);

    // Auto remove notification after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id!);
      }, notification.duration);
    }
  }

  // Remove specific notification
  removeNotification(id: string): void {
    const currentNotifications = this.notifications$.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notifications$.next(filteredNotifications);
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications$.next([]);
  }

  // Generate unique ID
  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
}
