import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageService = inject(MessageService);

  showSuccess(title: string, message: string, duration = 4000): void {
    this.messageService.add({ severity: 'success', summary: title, detail: message, life: duration });
  }

  showError(title: string, message: string, duration = 5000): void {
    this.messageService.add({ severity: 'error', summary: title, detail: message, life: duration });
  }

  showWarning(title: string, message: string, duration = 4000): void {
    this.messageService.add({ severity: 'warn', summary: title, detail: message, life: duration });
  }

  showInfo(title: string, message: string, duration = 3000): void {
    this.messageService.add({ severity: 'info', summary: title, detail: message, life: duration });
  }
}
