export interface NotificationInterface {
  id?: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  closable?: boolean;
}

export interface ToastPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}
