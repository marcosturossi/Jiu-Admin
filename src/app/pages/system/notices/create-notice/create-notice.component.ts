import { Component, Output, EventEmitter } from '@angular/core';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateNoticesDTO } from '../../../../generated_services/model/createNoticesDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-notice',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-notice.component.html',
  styleUrl: './create-notice.component.scss'
})
export class CreateNoticeComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() noticeCreated = new EventEmitter<void>();
  noticeForm!: FormGroup;

  constructor(
    private noticesService: NoticesService,
    private formBuilder: FormBuilder,
  ) {
    this.noticeForm = this.formBuilder.group({
      description: ["", Validators.required],
      isActive: [true],
    })
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.noticeForm.valid) {
      this.noticesService.apiNoticesPost(this.formToCreateNotice()).subscribe({
        next: result => {
          this.noticeCreated.emit();
          this.close();
        },
        error: error => console.log(error)
      });
    }
  }

  formToCreateNotice(): CreateNoticesDTO {
    const formValue = this.noticeForm.value;
    return {
      description: formValue.description,
      isActive: formValue.isActive,
    } as CreateNoticesDTO
  }
}
