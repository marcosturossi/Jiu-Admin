import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { ShowGraduationDTO } from '../../../generated_services';
import { UpdateGraduationComponent } from './update-graduation/update-graduation.component';
import { CreateGraduationComponent } from './create-graduation/create-graduation.component';

@Component({
  selector: 'app-graduations',
  imports: [CommonModule, UpdateGraduationComponent, CreateGraduationComponent],
  templateUrl: './graduations.component.html',
  styleUrl: './graduations.component.scss'
})
export class GraduationsComponent implements OnInit {
  graduations: ShowGraduationDTO[] = []

  openedCreateGraduation: boolean = false
  openedUpdateGraduation: boolean = false
  selectedGraduation!: ShowGraduationDTO;

  constructor(private graduationService: GraduationService) {

  }

  ngOnInit(): void {
    this.loadGraduations();
  }

  loadGraduations(): void {
    this.graduationService.apiGraduationGet().subscribe(
      {
        next: (result) => this.graduations = result
      }
    )
  }

  openCreateGraduation() {
    this.openedCreateGraduation = true
  }

  closeCreateGraduation() {
    this.openedCreateGraduation = false
    this.loadGraduations(); // Reload data
  }

  openUpdateGraduation(graduation: ShowGraduationDTO) {
    this.selectedGraduation = graduation
    this.openedUpdateGraduation = true
  }

  closeUpdateGraduation() {
    this.openedUpdateGraduation = false
    this.loadGraduations(); // Reload data
  }

  onGraduationCreated() {
    this.loadGraduations();
    this.closeCreateGraduation();
  }

  onGraduationUpdated() {
    this.loadGraduations();
    this.closeUpdateGraduation();
  }

  deleteGraduation(graduation: ShowGraduationDTO) {
    if (confirm('Tem certeza que deseja excluir esta graduação?')) {
      this.graduationService.apiGraduationIdDelete(graduation.id!).subscribe({
        next: () => {
          this.loadGraduations();
        },
        error: (error) => console.log(error)
      });
    }
  }
}
