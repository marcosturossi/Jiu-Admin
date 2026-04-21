import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Keycloak from 'keycloak-js';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PublicService } from '../../generated_services/api/public.service';
import { AcademySessionService } from '../../services/academy-session.service';

@Component({
  selector: 'app-select-academy',
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessageModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './select-academy.component.html',
  styleUrl: './select-academy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAcademyComponent implements OnInit {
  private readonly keycloak         = inject(Keycloak);
  private readonly router           = inject(Router);
  private readonly publicService    = inject(PublicService);
  private readonly academySession   = inject(AcademySessionService);

  protected readonly slug        = signal('');
  protected readonly isLoading   = signal(false);
  protected readonly errorMsg    = signal<string | null>(null);

  ngOnInit(): void {
    if (this.keycloak.authenticated) {
      this.router.navigate(['/system']);
    }
  }

  protected onSubmit(): void {
    const slugValue = this.slug().trim().toLowerCase();
    if (!slugValue) {
      this.errorMsg.set('Por favor, informe o slug da academia.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.publicService.apiPublicAcademiesSlugRealmGet(slugValue).subscribe({
      next: (realmInfo) => {
        if (!realmInfo.keycloakUrl || !realmInfo.realm) {
          this.isLoading.set(false);
          this.errorMsg.set('Academia não encontrada ou mal configurada. Verifique o slug.');
          return;
        }
        this.academySession.setAcademy(slugValue, null, realmInfo.keycloakUrl, realmInfo.realm);
        // Full reload so Keycloak APP_INITIALIZER picks up the new realm config
        window.location.href = '/';
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('Academia não encontrada. Verifique o slug e tente novamente.');
      },
    });
  }
}
