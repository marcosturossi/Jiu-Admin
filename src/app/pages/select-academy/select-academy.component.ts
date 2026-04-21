import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Keycloak from 'keycloak-js';
import { PublicService } from '../../generated_services/api/public.service';
import { AcademySessionService } from '../../services/academy-session.service';
import { environment } from '../../enviroments/environment';

export interface PublicAcademyItem {
  slug: string;
  name: string;
}

@Component({
  selector: 'app-select-academy',
  standalone: true,
  imports: [],
  templateUrl: './select-academy.component.html',
  styleUrl: './select-academy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAcademyComponent implements OnInit {
  private readonly keycloak       = inject(Keycloak);
  private readonly router         = inject(Router);
  private readonly http           = inject(HttpClient);
  private readonly publicService  = inject(PublicService);
  private readonly academySession = inject(AcademySessionService);

  protected readonly academies    = signal<PublicAcademyItem[] | null>(null);
  protected readonly selectedSlug = signal('');
  protected readonly isLoading    = signal(false);
  protected readonly errorMsg     = signal<string | null>(null);
  protected readonly fetchError   = signal(false);

  protected readonly ready = computed(() => this.academies() !== null);

  ngOnInit(): void {
    if (this.keycloak.authenticated) {
      this.router.navigate(['/system']);
      return;
    }

    const current = this.academySession.getAcademy();

    this.http.get<PublicAcademyItem[]>(`${environment.server}/api/public/academies`).subscribe({
      next: (list) => {
        const safe = Array.isArray(list) ? list : [];
        this.academies.set(safe);
        if (safe.length > 0) {
          const preselect = current && safe.some(a => a.slug === current.slug)
            ? current.slug
            : safe[0].slug;
          this.selectedSlug.set(preselect);
        }
      },
      error: () => {
        this.academies.set([]);
        this.fetchError.set(true);
      },
    });
  }

  protected onSubmit(): void {
    const slug = this.selectedSlug();
    if (!slug) {
      this.errorMsg.set('Selecione uma academia.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.publicService.apiPublicAcademiesSlugRealmGet(slug).subscribe({
      next: (realmInfo) => {
        if (!realmInfo.keycloakUrl || !realmInfo.realm) {
          this.isLoading.set(false);
          this.errorMsg.set('Academia não encontrada ou mal configurada.');
          return;
        }
        this.academySession.setAcademy(slug, null, realmInfo.keycloakUrl, realmInfo.realm);
        this.navigateToRoot();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('Erro ao conectar com a academia. Tente novamente.');
      },
    });
  }

  protected navigateToRoot(): void {
    window.location.href = '/';
  }
}

