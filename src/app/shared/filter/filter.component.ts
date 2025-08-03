import { Component, EventEmitter, Input, Output } from '@angular/core';
import {FilterInterface, OperationEnum} from '../interface/filter.interface';
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
    selector: 'app-filter',
    templateUrl: './filter.component.html',
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  @Input() filterKeys!: string[]
  @Output() setFilterEvent: EventEmitter<FilterInterface> = new EventEmitter()
  @Output() closeFilterEvent:  EventEmitter<void> = new EventEmitter()

  value:string = ""
  selectedFilterKey: string = ""
  operations = Object.values(OperationEnum);
  selectedOperation = OperationEnum.eq


  close(){
    this.closeFilterEvent.emit()
  }


  save(){
    if (this.selectedFilterKey != ""){
      this.setFilterEvent.emit({key:this.selectedFilterKey, operation:this.selectedOperation, value:this.value})
      this.closeFilterEvent.emit()
    }
  }

}
