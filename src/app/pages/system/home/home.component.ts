import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SubnavService } from '../../../services/subnav.service';
import { TopStudentsComponent } from '../../../shared/dashboard-components/top-students/top-students.component';
import { BirthdayThisMonthComponent } from '../../../shared/dashboard-components/birthday-this-month/birthday-this-month.component';
import { NewStudentsThisMonthComponent } from '../../../shared/dashboard-components/new-students-this-month/new-students-this-month.component';
import { FrequenciesBeltDistributionComponent } from '../../../shared/dashboard-components/frequencies-belt-distribution/frequencies-belt-distribution.component';
import { AvgStudentsByClassComponent } from '../../../shared/dashboard-components/avg-students-by-class/avg-students-by-class.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TopStudentsComponent,
    BirthdayThisMonthComponent,
    NewStudentsThisMonthComponent,
    FrequenciesBeltDistributionComponent,
    AvgStudentsByClassComponent,
  ],
})
export class HomeComponent {
  private readonly subnavService = inject(SubnavService);

  constructor() {
    this.subnavService.setTitle('Home');
  }
}
