import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BeltService } from '../../../../generated_services';
import { ShowBeltDTO, UpdateBeltDTO } from '../../../../generated_services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-belt',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-belt.component.html',
  styleUrl: './update-belt.component.scss'
})
export class UpdateBeltComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() beltUpdated = new EventEmitter<void>();
  @Input() belt!: ShowBeltDTO;
  beltForm!: FormGroup;

  constructor(
    private beltService: BeltService,
    private formBuilder: FormBuilder,
  ) {
    this.beltForm = this.formBuilder.group({
      color: ["", Validators.required],
      orderIndex: [0, [Validators.required, Validators.min(0)]],
      isForKids: [false],
    })
  }

  ngOnInit(): void {
    this.beltForm.patchValue({
      color: this.belt.color,
      orderIndex: this.belt.orderIndex,
      isForKids: this.belt.isForKids,
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    this.beltService.apiBeltIdPut(this.belt.id!, this.formToUpdateBelt()).subscribe(
      {
        next: result => {
          this.beltUpdated.emit();
          this.close();
        },
        error: error => console.log(error)
      })
  }

  formToUpdateBelt(): UpdateBeltDTO {
    const formValue = this.beltForm.value;
    return {
      color: formValue.color,
      orderIndex: formValue.orderIndex,
      isForKids: formValue.isForKids,
    } as UpdateBeltDTO
  }
}
