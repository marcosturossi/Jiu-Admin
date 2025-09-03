import { Component, OnInit } from '@angular/core';
import { PersonsService } from '../../../generated_services/api2/api/persons.service';
import { PersonDetailResponse } from '../../../generated_services/api2/model/personDetailResponse';
import { PersonListResponse } from '../../../generated_services/api2/model/personListResponse';
import { CreatePersonsComponent } from './create-persons/create-persons.component';
import { UpdatePersonsComponent } from './update-persons/update-persons.component';
import { SubnavService } from '../../../services/subnav.service';

@Component({
  selector: 'app-face-recognition',
  templateUrl: './face-recognition.component.html',
  styleUrl: './face-recognition.component.scss',
  standalone: true,
  imports: [CreatePersonsComponent, UpdatePersonsComponent]
})
export class FaceRecognitionComponent implements OnInit {
  persons: PersonDetailResponse[] = [];
  isLoading = false;
  error: string | null = null;
  showCreateModal = false;
  showUpdateModal = false;
  selectedPerson: PersonDetailResponse | null = null;

  constructor(
    private personsService: PersonsService,
    private subnavService: SubnavService
  ) {}

  ngOnInit(): void {
    this.subnavService.setTitle("Reconhecimento Facial");
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

  openUpdatePersonModal(person: PersonDetailResponse): void {
    this.selectedPerson = person;
    this.showUpdateModal = true;
  }

  onPersonUpdated(updatedPerson: PersonDetailResponse): void {
    this.showUpdateModal = false;
    this.selectedPerson = null;
    this.loadPersons(); // Reload the list to reflect changes
  }

  onCloseUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedPerson = null;
  }

  deletePerson(person: PersonDetailResponse): void {
    if (confirm(`Tem certeza que deseja excluir a pessoa "${person.name}"?`)) {
      this.personsService.deletePersonApiV1PersonsPersonIdDelete(person.id).subscribe({
        next: () => {
          this.loadPersons();
        },
        error: (error) => {
          console.error('Erro ao excluir pessoa:', error);
          this.error = 'Erro ao excluir pessoa.';
        }
      });
    }
  }

  getImageSrc(img: any): string {
    if (!img || !img.base64) {
      console.warn('Image or base64 data is missing:', img);
      return '';
    }
    
    // Clean the base64 string (remove any whitespace or invalid characters)
    let base64 = img.base64.trim();
    
    // Check if base64 already includes data:image prefix
    if (base64.startsWith('data:image')) {
      return base64;
    }
    
    // Remove any data:image prefix that might be embedded in the base64 string
    if (base64.includes('base64,')) {
      base64 = base64.split('base64,')[1];
    }
    
    // If not, add the prefix
    try {
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error creating image src:', error, img);
      return '';
    }
  }

  getTotalImages(): number {
    return this.persons.reduce((total, person) => {
      return total + (person.images?.length || 0);
    }, 0);
  }

  getPersonsWithImages(): number {
    return this.persons.filter(person => person.images && person.images.length > 0).length;
  }
}
