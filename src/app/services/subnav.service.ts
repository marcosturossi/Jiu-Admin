import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SubnavService {
  title: string = ""
  setTitleEvent: EventEmitter<string> = new EventEmitter()
  constructor() { }


  setTitle(title: string) {
    this.setTitleEvent.emit(title);
  }
}
