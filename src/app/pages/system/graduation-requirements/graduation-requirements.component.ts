import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraduationRequirementsService, ShowGraduationRequirementsDTO, BeltService, ShowBeltDTO, PaginationBeltDTO } from '../../../generated_services';
import { CreateGraduationRequirementComponent } from './create-graduation-requirement/create-graduation-requirement.component';
import { UpdateGraduationRequirementComponent } from './update-graduation-requirement/update-graduation-requirement.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-graduation-requirements',
  imports: [CommonModule, CreateGraduationRequirementComponent, UpdateGraduationRequirementComponent],
  templateUrl: './graduation-requirements.component.html',
  styleUrl: './graduation-requirements.component.scss'
})
export class GraduationRequirementsComponent implements OnInit {
  graduationRequirements: ShowGraduationRequirementsDTO[] = [];
  belts!: PaginationBeltDTO;
  isLoading: boolean = false;
  openedCreateGraduationRequirement: boolean = false;
  selectedGraduationRequirement!: ShowGraduationRequirementsDTO;
  openedUpdateGraduationRequirement: boolean = false;

  constructor(
    private graduationRequirementsService: GraduationRequirementsService,
    private beltService: BeltService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Requisitos de Graduação");
    this.loadGraduationRequirements();
    this.loadBelts();
  }

  loadGraduationRequirements(): void {
    this.isLoading = true;
    this.graduationRequirementsService.apiGraduationRequirementsGet().subscribe(
      {
        next: (result) => {
          this.graduationRequirements = result;
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          this.notificationService.showError(
            'Erro ao Carregar Requisitos!', 
            'Não foi possível carregar a lista de requisitos de graduação. Tente novamente.'
          );
        }
      }
    )
  }

  loadBelts(): void {
    this.beltService.apiBeltGet().subscribe(
      {
        next: (result) => {
          this.belts = result;
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Carregar Faixas!', 
            'Não foi possível carregar a lista de faixas. Tente novamente.'
          );
        }
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
    const belt = this.belts.items!.find(b => b.id === beltId);
    return belt ? belt.color : 'N/A';
  }

  deleteGraduationRequirement(graduationRequirement: ShowGraduationRequirementsDTO) {
    if (confirm('Tem certeza que deseja excluir este requisito de graduação?')) {
      this.graduationRequirementsService.apiGraduationRequirementsIdDelete(graduationRequirement.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Requisito Excluído!', 
            'O requisito de graduação foi excluído com sucesso.'
          );
          this.loadGraduationRequirements();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir Requisito!', 
            'Não foi possível excluir o requisito de graduação. Tente novamente.'
          );
        }
      });
    }
  }
}
