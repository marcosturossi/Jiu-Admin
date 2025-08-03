import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GraduationRequirementsService, BeltService, ShowBeltDTO } from '../../../../generated_services';
import { ShowGraduationRequirementsDTO, UpdateGraduationRequirementsDTO } from '../../../../generated_services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-graduation-requirement',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-graduation-requirement.component.html',
  styleUrl: './update-graduation-requirement.component.scss'
})
export class UpdateGraduationRequirementComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() graduationRequirementUpdated = new EventEmitter<void>();
  @Input() graduationRequirement!: ShowGraduationRequirementsDTO;
  graduationRequirementForm!: FormGroup;
  belts: ShowBeltDTO[] = [];

  constructor(
    private graduationRequirementsService: GraduationRequirementsService,
    private beltService: BeltService,
    private formBuilder: FormBuilder,
  ) {
    this.graduationRequirementForm = this.formBuilder.group({
      beltId: ["", Validators.required],
      description: ["", Validators.required],
      minimumClasses: [0, [Validators.min(0)]],
    })
  }

  ngOnInit(): void {
    this.beltService.apiBeltGet().subscribe(
      {
        next: (result) => this.belts = result
      }
    );
    
    this.graduationRequirementForm.patchValue({
      beltId: this.graduationRequirement.beltId,
      description: this.graduationRequirement.description,
      minimumClasses: this.graduationRequirement.minimumClasses || 0,
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    this.graduationRequirementsService.apiGraduationRequirementsIdPut(this.graduationRequirement.id!, this.formToUpdateGraduationRequirement()).subscribe(
      {
        next: result => {
          this.graduationRequirementUpdated.emit();
          this.close();
        },
        error: error => console.log(error)
      })
  }

  formToUpdateGraduationRequirement(): UpdateGraduationRequirementsDTO {
    const formValue = this.graduationRequirementForm.value;
    return {
      beltId: formValue.beltId,
      description: formValue.description,
      minimumClasses: formValue.minimumClasses || 0,
    } as UpdateGraduationRequirementsDTO
  }
}
