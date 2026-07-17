import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

interface NavItem {
  route: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  groupIcon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  protected readonly sidebarExpanded = signal(false);
  protected readonly openSections = signal<Set<string>>(new Set());

  protected readonly sections: NavSection[] = [
    {
      title: 'Principal',
      groupIcon: 'bi bi-house',
      items: [
        { route: '/system/home', label: 'Início', icon: 'bi bi-house' },
      ]
    },
    {
      title: 'Acadêmico',
      groupIcon: 'bi bi-mortarboard',
      items: [
        { route: '/system/student-onboarding', label: 'Cadastros', icon: 'bi bi-clipboard-check' },
        { route: '/system/students', label: 'Alunos', icon: 'bi bi-people' },
        { route: '/system/lessons', label: 'Aulas', icon: 'bi bi-calendar3' },
        { route: '/system/graduations', label: 'Graduações', icon: 'bi bi-award' },
        { route: '/system/frequencies', label: 'Frequências', icon: 'bi bi-check2-square' },
        { route: '/system/belts', label: 'Faixas', icon: 'bi bi-bookmark' },
        { route: '/system/graduation-requirements', label: 'Requisitos', icon: 'bi bi-list-check' },
      ]
    },
    {
      title: 'Financeiro',
      groupIcon: 'bi bi-wallet2',
      items: [
        { route: '/system/finance-dashboard', label: 'Dashboard', icon: 'bi bi-bar-chart-line' },
        { route: '/system/fee-plans', label: 'Planos', icon: 'bi bi-receipt' },
        { route: '/system/contracts', label: 'Contratos', icon: 'bi bi-file-earmark-text' },
        { route: '/system/accounts-receivable', label: 'Contas a Receber', icon: 'bi bi-arrow-down-circle' },
        { route: '/system/accounts-payable', label: 'Contas a Pagar', icon: 'bi bi-arrow-up-circle' },
        { route: '/system/suppliers', label: 'Fornecedores', icon: 'bi bi-truck' },
        { route: '/system/transaction-categories', label: 'Categorias', icon: 'bi bi-tags' },
      ]
    },
    {
      title: 'Comunicação',
      groupIcon: 'bi bi-chat-dots',
      items: [
        { route: '/system/notices', label: 'Avisos', icon: 'bi bi-bell' },
        { route: '/system/notification', label: 'Notificações', icon: 'bi bi-megaphone' },
      ]
    },
    {
      title: 'Saúde e Segurança',
      groupIcon: 'bi bi-shield-check',
      items: [
        { route: '/system/medical-clearances', label: 'Atestados Médicos', icon: 'bi bi-heart-pulse' },
        { route: '/system/face-recognition', label: 'Reconhecimento', icon: 'bi bi-person-badge' },
      ]
    },
    // {
    //   title: 'Configurações',
    //   groupIcon: 'bi bi-gear',
    //   items: [
    //     { route: '/system/academies', label: 'Academias', icon: 'bi bi-building' },
    //   ]
    // },
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => this.initOpenSections());
  }

  private toggleHandler = (event: Event) => {
    const customEvent = event as CustomEvent;
    this.sidebarExpanded.set(customEvent.detail.expanded);
  };

  ngOnInit(): void {
    window.addEventListener('sidebar-toggle', this.toggleHandler);
    this.initOpenSections();
  }

  ngOnDestroy(): void {
    window.removeEventListener('sidebar-toggle', this.toggleHandler);
  }

  private initOpenSections(): void {
    const url = this.router.url;
    const active = this.sections.find(s => s.items.some(i => url.startsWith(i.route)));
    this.openSections.update(current => {
      const next = new Set(current);
      next.add(active ? active.title : 'Principal');
      return next;
    });
  }

  protected isSectionOpen(title: string): boolean {
    return this.openSections().has(title);
  }

  protected toggleSection(title: string): void {
    this.openSections.update(set => {
      const next = new Set(set);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  protected isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  protected navigate(route: string): void {
    this.router.navigate([route]);
  }
}

