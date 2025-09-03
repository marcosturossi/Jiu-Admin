import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeltService, ShowBeltDTO } from '../../../generated_services';
import { CreateBeltComponent } from './create-belt/create-belt.component';
import { UpdateBeltComponent } from './update-belt/update-belt.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';

@Component({
  selector: 'app-belts',
  imports: [CommonModule, CreateBeltComponent, UpdateBeltComponent, DatePipe],
  templateUrl: './belts.component.html',
  styleUrl: './belts.component.scss'
})
export class BeltsComponent implements OnInit {
  belts: ShowBeltDTO[] = [];
  openedCreateBelt: boolean = false;
  selectedBelt!: ShowBeltDTO;
  openedUpdateBelt: boolean = false;

  constructor(
    private beltService: BeltService,
    private subnavService: SubnavService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Faixas");
    this.loadBelts();
  }

  loadBelts(): void {
    this.beltService.apiBeltGet().subscribe(
      {
        next: (result) => this.belts = result
      }
    )
  }

  openCreateBelt() {
    this.openedCreateBelt = true
  }

  closeCreateBelt() {
    this.openedCreateBelt = false
  }

  openUpdateBelt(belt: ShowBeltDTO) {
    this.selectedBelt = belt
    this.openedUpdateBelt = true
  }

  closeUpdateBelt() {
    this.openedUpdateBelt = false
  }

  onBeltCreated() {
    this.loadBelts();
    this.closeCreateBelt();
  }

  onBeltUpdated() {
    this.loadBelts();
    this.closeUpdateBelt();
  }

  deleteBelt(belt: ShowBeltDTO) {
    if (confirm('Tem certeza que deseja excluir esta faixa?')) {
      this.beltService.apiBeltIdDelete(belt.id!).subscribe({
        next: () => {
          this.loadBelts();
        },
        error: (error) => console.log(error)
      });
    }
  }
}
