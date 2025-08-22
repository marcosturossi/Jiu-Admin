import { Component, OnInit } from '@angular/core';
import { PersonsService } from '../../../generated_services/api2/api/persons.service';
import { PersonDetailResponse } from '../../../generated_services/api2/model/personDetailResponse';
import { PersonListResponse } from '../../../generated_services/api2/model/personListResponse';
import { CreatePersonsComponent } from './create-persons/create-persons.component';

@Component({
  selector: 'app-face-recognition',
  templateUrl: './face-recognition.component.html',
  styleUrl: './face-recognition.component.scss',
  standalone: true,
  imports: [CreatePersonsComponent]
})
export class FaceRecognitionComponent implements OnInit {
  persons: PersonDetailResponse[] = [];
  isLoading = false;
  error: string | null = null;
  showCreateModal = false;

  constructor(private personsService: PersonsService) {}

  ngOnInit(): void {
    this.loadPersons();
  }

  loadPersons(): void {
    this.isLoading = true;
    this.personsService.listPersonsApiV1PersonsGet().subscribe({
      next: (result: PersonListResponse) => {
        this.persons = result.persons;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = 'Erro ao carregar pessoas.';
        this.isLoading = false;
      }
    });
  }

  openCreatePersonModal(): void {
    this.showCreateModal = true;
  }

  onPersonCreated(): void {
    this.showCreateModal = false;
    this.loadPersons();
  }

  onCloseCreateModal(): void {
    this.showCreateModal = false;
  }
}
