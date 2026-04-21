import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Keycloak from 'keycloak-js';
import { PublicService } from '../../generated_services/api/public.service';
import { AcademySessionService, AcademySession } from '../../services/academy-session.service';

@Component({
  selector: 'app-select-academy',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './select-academy.component.html',
  styleUrl: './select-academy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAcademyComponent implements OnInit {
  private readonly keycloak         = inject(Keycloak);
  private readonly router           = inject(Router);
  private readonly publicService    = inject(PublicService);
  private readonly academySession   = inject(AcademySessionService);

  protected readonly history        = signal<AcademySession[]>([]);
  protected readonly selectedOption = signal<string>('other');
  protected readonly customSlug     = signal('');
  protected readonly isLoading      = signal(false);
  protected readonly errorMsg       = signal<string | null>(null);

  protected readonly showCustomInput = computed(
    () => this.history().length === 0 || this.selectedOption() === 'other'
  );

  ngOnInit(): void {
    if (this.keycloak.authenticated) {
      this.router.navigate(['/system']);
      return;
    }

    const hist = this.academySession.getHistory();
    this.history.set(hist);

    const current = this.academySession.getAcademy();
    if (current && hist.some(h => h.slug === current.slug)) {
      this.selectedOption.set(current.slug);
    } else {
      this.selectedOption.set('other');
    }
  }

  protected onSubmit(): void {
    const slug = this.showCustomInput()
      ? this.customSlug().trim().toLowerCase()
      : this.selectedOption();

    if (!slug) {
      this.errorMsg.set('Por favor, informe o slug da academia.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.publicService.apiPublicAcademiesSlugRealmGet(slug).subscribe({
      next: (realmInfo) => {
        if (!realmInfo.keycloakUrl || !realmInfo.realm) {
          this.isLoading.set(false);
          this.errorMsg.set('Academia não encontrada ou mal configurada. Verifique o slug.');
          return;
        }
        this.academySession.setAcademy(slug, null, realmInfo.keycloakUrl, realmInfo.realm);
        this.navigateToRoot();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('Academia não encontrada. Verifique o slug e tente novamente.');
      },
    });
  }

  protected navigateToRoot(): void {
    window.location.href = '/';
  }
}
