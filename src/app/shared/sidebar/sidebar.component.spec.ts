import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import Keycloak from 'keycloak-js';
import { NAV_SECTIONS } from '../nav-config';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let routerStub: { url: string; events: typeof EMPTY; navigate: jasmine.Spy };

  function setup(url = '/system/students'): void {
    routerStub = { url, events: EMPTY, navigate: jasmine.createSpy('navigate') };

    // isVisible() gates adminOnly nav items on AuthServiceService.isTenantAdmin() (realmAccess
    // roles), which needs a Keycloak instance — the tests below assume every item is visible
    // (including adminOnly ones like payment-settings), so the stub carries the "admin" role.
    const keycloakStub: Partial<Keycloak> = { realmAccess: { roles: ['admin'] }, tokenParsed: {} };

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: Keycloak, useValue: keycloakStub },
      ],
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    // Ensure no lingering event listeners affect other tests
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: false } }));
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  describe('initOpenSections', () => {
    it('opens the section matching the current route on init', () => {
      setup('/system/students');
      expect((component as any).isSectionOpen('Acadêmico')).toBeTrue();
    });

    it('keeps other sections closed on init', () => {
      setup('/system/students');
      expect((component as any).isSectionOpen('Financeiro')).toBeFalse();
      expect((component as any).isSectionOpen('Principal')).toBeFalse();
    });

    it('defaults to Principal when route matches no section', () => {
      setup('/system/unknown-route');
      expect((component as any).isSectionOpen('Principal')).toBeTrue();
    });

    it('opens Financeiro section for a financial route', () => {
      setup('/system/contracts');
      expect((component as any).isSectionOpen('Financeiro')).toBeTrue();
      expect((component as any).isSectionOpen('Acadêmico')).toBeFalse();
    });
  });

  describe('toggleSection', () => {
    it('opens a closed section', () => {
      setup('/system/students');
      expect((component as any).isSectionOpen('Financeiro')).toBeFalse();
      (component as any).toggleSection('Financeiro');
      expect((component as any).isSectionOpen('Financeiro')).toBeTrue();
    });

    it('closes an open section', () => {
      setup('/system/students');
      expect((component as any).isSectionOpen('Acadêmico')).toBeTrue();
      (component as any).toggleSection('Acadêmico');
      expect((component as any).isSectionOpen('Acadêmico')).toBeFalse();
    });

    it('can open multiple sections independently', () => {
      setup('/system/students');
      (component as any).toggleSection('Financeiro');
      expect((component as any).isSectionOpen('Acadêmico')).toBeTrue();
      expect((component as any).isSectionOpen('Financeiro')).toBeTrue();
    });
  });


  describe('collapsed mode template', () => {
    it('shows all individual item links (not group buttons)', () => {
      setup('/system/students');
      const links = fixture.nativeElement.querySelectorAll('.sidebar-section-collapsed .sidebar-link');
      // Derived from NAV_SECTIONS rather than a hardcoded count so this doesn't silently drift
      // out of sync every time a nav item is added or removed.
      const totalItems = NAV_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
      expect(links.length).toBe(totalItems);
    });

    it('active item link has active class', () => {
      setup('/system/students');
      const links: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-section-collapsed .sidebar-link');
      const studentsLink = Array.from(links).find(l => l.getAttribute('title') === 'Alunos');
      expect(studentsLink?.classList.contains('active')).toBeTrue();
    });

    it('inactive item links do not have active class', () => {
      setup('/system/students');
      const links: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-section-collapsed .sidebar-link');
      const contractsLink = Array.from(links).find(l => l.getAttribute('title') === 'Contratos');
      expect(contractsLink?.classList.contains('active')).toBeFalse();
    });

    it('does not show section group buttons in collapsed mode', () => {
      setup('/system/students');
      const buttons = fixture.nativeElement.querySelectorAll('.sidebar-group-btn');
      expect(buttons.length).toBe(0);
    });

    it('does not show section headers in collapsed mode', () => {
      setup('/system/students');
      const headers = fixture.nativeElement.querySelectorAll('.sidebar-group-header');
      expect(headers.length).toBe(0);
    });

    it('clicking an item navigates without expanding the sidebar', () => {
      setup('/system/students');
      const links: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-section-collapsed .sidebar-link');
      const contractsLink = Array.from(links).find(l => l.getAttribute('title') === 'Contratos') as HTMLElement;
      contractsLink.click();
      expect(routerStub.navigate).toHaveBeenCalledWith(['/system/contracts']);
      expect((component as any).sidebarExpanded()).toBeFalse();
    });
  });

  describe('expanded mode template', () => {
    beforeEach(() => {
      setup('/system/students');
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: true } }));
      fixture.detectChanges();
    });

    it('shows one group header per section', () => {
      const headers = fixture.nativeElement.querySelectorAll('.sidebar-group-header');
      expect(headers.length).toBe(NAV_SECTIONS.length);
    });

    it('does not show collapsed group buttons in expanded mode', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.sidebar-group-btn');
      expect(buttons.length).toBe(0);
    });

    it('section items are open for the active route section', () => {
      const openItems = fixture.nativeElement.querySelectorAll('.sidebar-section-items.open');
      expect(openItems.length).toBeGreaterThan(0);
    });

    it('the open section contains the expected nav links', () => {
      const openLinks = fixture.nativeElement.querySelectorAll('.sidebar-section-items.open .sidebar-link');
      const labels = Array.from(openLinks).map((el: any) => el.textContent.trim());
      expect(labels.some(l => l.includes('Alunos'))).toBeTrue();
    });

    it('section items are closed for inactive sections', () => {
      const allItems: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-section-items');
      const closedItems = Array.from(allItems).filter(el => !el.classList.contains('open'));
      expect(closedItems.length).toBeGreaterThan(0);
    });

    it('clicking a group header toggles section open/closed', () => {
      const headers: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-group-header');
      const academicoHeader = Array.from(headers).find(h => h.textContent?.includes('Acadêmico')) as HTMLElement;
      expect(academicoHeader).toBeTruthy();

      expect((component as any).isSectionOpen('Acadêmico')).toBeTrue();
      academicoHeader.click();
      fixture.detectChanges();
      expect((component as any).isSectionOpen('Acadêmico')).toBeFalse();
    });
  });
});
