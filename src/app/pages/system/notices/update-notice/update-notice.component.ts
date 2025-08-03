import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoticesService } from '../../../../generated_services/api/notices.service';
import { ShowNoticesDTO, UpdateNoticesDTO } from '../../../../generated_services/model/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-notice',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-notice.component.html',
  styleUrl: './update-notice.component.scss'
})
export class UpdateNoticeComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() noticeUpdated = new EventEmitter<void>();
  @Input() notice!: ShowNoticesDTO;
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

  ngOnInit(): void {
    this.noticeForm.patchValue({
      description: this.notice.description,
      isActive: this.notice.isActive,
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    if (this.noticeForm.valid) {
      this.noticesService.apiNoticesIdPut(this.notice.id!, this.formToUpdateNotice()).subscribe({
        next: result => {
          this.noticeUpdated.emit();
          this.close();
        },
        error: error => console.log(error)
      });
    }
  }

  formToUpdateNotice(): UpdateNoticesDTO {
    const formValue = this.noticeForm.value;
    return {
      description: formValue.description,
      isActive: formValue.isActive,
    } as UpdateNoticesDTO
  }
}
