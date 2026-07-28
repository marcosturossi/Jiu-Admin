import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SubnavService {
  private readonly _title = signal('');
  readonly title = this._title.asReadonly();

  setTitle(title: string): void {
    this._title.set(title);
  }
}
