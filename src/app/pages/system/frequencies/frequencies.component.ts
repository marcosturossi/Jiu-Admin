import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrequencyService, ShowFrequencyDTO } from '../../../generated_services';
import { CreateFrequencyComponent } from './create-frequency/create-frequency.component';
import { UpdateFrequencyComponent } from './update-frequency/update-frequency.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';

@Component({
  selector: 'app-frequencies',
  imports: [CommonModule, CreateFrequencyComponent, UpdateFrequencyComponent, DatePipe],
  templateUrl: './frequencies.component.html',
  styleUrl: './frequencies.component.scss'
})
export class FrequenciesComponent implements OnInit {
  frequencies: ShowFrequencyDTO[] = [];
  openedCreateFrequency: boolean = false;
  selectedFrequency!: ShowFrequencyDTO;
  openedUpdateFrequency: boolean = false;

  constructor(
    private frequencyService: FrequencyService,
    private subnavService: SubnavService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Frequências");
    this.loadFrequencies();
  }

  loadFrequencies(): void {
    this.frequencyService.apiFrequencyGet().subscribe(
      {
        next: (result) => this.frequencies = result
      }
    )
  }

  openCreateFrequency() {
    this.openedCreateFrequency = true
  }

  closeCreateFrequency() {
    this.openedCreateFrequency = false
  }

  openUpdateFrequency(frequency: ShowFrequencyDTO) {
    this.selectedFrequency = frequency
    this.openedUpdateFrequency = true
  }

  closeUpdateFrequency() {
    this.openedUpdateFrequency = false
  }

  onFrequencyCreated() {
    this.loadFrequencies();
    this.closeCreateFrequency();
  }

  onFrequencyUpdated() {
    this.loadFrequencies();
    this.closeUpdateFrequency();
  }

  deleteFrequency(frequency: ShowFrequencyDTO) {
    if (confirm('Tem certeza que deseja excluir esta frequência?')) {
      this.frequencyService.apiFrequencyIdDelete(frequency.id!).subscribe({
        next: () => {
          this.loadFrequencies();
        },
        error: (error) => console.log(error)
      });
    }
  }
}

