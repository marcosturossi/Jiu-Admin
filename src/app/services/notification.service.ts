import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastr = inject(ToastrService);

  showSuccess(title: string, message: string, duration = 4000): void {
    this.toastr.success(message, title, { timeOut: duration });
  }

  showError(title: string, message: string, duration = 5000): void {
    this.toastr.error(message, title, { timeOut: duration });
  }

  showWarning(title: string, message: string, duration = 4000): void {
    this.toastr.warning(message, title, { timeOut: duration });
  }

  showInfo(title: string, message: string, duration = 3000): void {
    this.toastr.info(message, title, { timeOut: duration });
  }
}
