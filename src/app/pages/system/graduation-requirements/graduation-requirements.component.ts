import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraduationRequirementsService, ShowGraduationRequirementsDTO, BeltService, ShowBeltDTO } from '../../../generated_services';
import { CreateGraduationRequirementComponent } from './create-graduation-requirement/create-graduation-requirement.component';
import { UpdateGraduationRequirementComponent } from './update-graduation-requirement/update-graduation-requirement.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-graduation-requirements',
  imports: [CommonModule, CreateGraduationRequirementComponent, UpdateGraduationRequirementComponent, DatePipe],
  templateUrl: './graduation-requirements.component.html',
  styleUrl: './graduation-requirements.component.scss'
})
export class GraduationRequirementsComponent implements OnInit {
  graduationRequirements: ShowGraduationRequirementsDTO[] = [];
  belts: ShowBeltDTO[] = [];
  openedCreateGraduationRequirement: boolean = false;
  selectedGraduationRequirement!: ShowGraduationRequirementsDTO;
  openedUpdateGraduationRequirement: boolean = false;

  constructor(
    private graduationRequirementsService: GraduationRequirementsService,
    private beltService: BeltService
  ) { }

  ngOnInit(): void {
    this.loadGraduationRequirements();
    this.loadBelts();
  }

  loadGraduationRequirements(): void {
    this.graduationRequirementsService.apiGraduationRequirementsGet().subscribe(
      {
        next: (result) => this.graduationRequirements = result
      }
    )
  }

  loadBelts(): void {
    this.beltService.apiBeltGet().subscribe(
      {
        next: (result) => this.belts = result
      }
    )
  }

  openCreateGraduationRequirement() {
    this.openedCreateGraduationRequirement = true
  }

  closeCreateGraduationRequirement() {
    this.openedCreateGraduationRequirement = false
  }

  openUpdateGraduationRequirement(graduationRequirement: ShowGraduationRequirementsDTO) {
    this.selectedGraduationRequirement = graduationRequirement
    this.openedUpdateGraduationRequirement = true
  }

  closeUpdateGraduationRequirement() {
    this.openedUpdateGraduationRequirement = false
  }

  onGraduationRequirementCreated() {
    this.loadGraduationRequirements();
    this.closeCreateGraduationRequirement();
  }

  onGraduationRequirementUpdated() {
    this.loadGraduationRequirements();
    this.closeUpdateGraduationRequirement();
  }

  getBeltColor(beltId: string): string {
    const belt = this.belts.find(b => b.id === beltId);
    return belt ? belt.color : 'N/A';
  }

  deleteGraduationRequirement(graduationRequirement: ShowGraduationRequirementsDTO) {
    if (confirm('Tem certeza que deseja excluir este requisito de graduação?')) {
      this.graduationRequirementsService.apiGraduationRequirementsIdDelete(graduationRequirement.id!).subscribe({
        next: () => {
          this.loadGraduationRequirements();
        },
        error: (error) => console.log(error)
      });
    }
  }
}
