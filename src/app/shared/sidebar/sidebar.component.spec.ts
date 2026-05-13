import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let routerStub: { url: string; events: typeof EMPTY; navigate: jasmine.Spy };

  function setup(url = '/system/students'): void {
    routerStub = { url, events: EMPTY, navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [{ provide: Router, useValue: routerStub }],
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

  describe('expandAndOpen', () => {
    it('opens the specified section', () => {
      setup('/system/students');
      expect((component as any).isSectionOpen('Financeiro')).toBeFalse();
      (component as any).expandAndOpen('Financeiro');
      expect((component as any).isSectionOpen('Financeiro')).toBeTrue();
    });

    it('dispatches sidebar-toggle event with expanded: true', (done) => {
      setup('/system/students');
      const handler = (e: Event) => {
        expect((e as CustomEvent).detail.expanded).toBeTrue();
        window.removeEventListener('sidebar-toggle', handler);
        done();
      };
      window.addEventListener('sidebar-toggle', handler);
      (component as any).expandAndOpen('Financeiro');
    });
  });

  describe('collapsed mode template', () => {
    it('shows one group button per section', () => {
      setup('/system/students');
      // sidebar starts collapsed
      const buttons = fixture.nativeElement.querySelectorAll('.sidebar-group-btn');
      expect(buttons.length).toBe(6); // 6 sections defined
    });

    it('group button has active class when a child route is active', () => {
      setup('/system/students');
      const buttons: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-group-btn');
      const academicoBtn = Array.from(buttons).find(b => b.getAttribute('title') === 'Acadêmico');
      expect(academicoBtn?.classList.contains('active')).toBeTrue();
    });

    it('group button does not have active class when no child route is active', () => {
      setup('/system/students');
      const buttons: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.sidebar-group-btn');
      const financeiroBtn = Array.from(buttons).find(b => b.getAttribute('title') === 'Financeiro');
      expect(financeiroBtn?.classList.contains('active')).toBeFalse();
    });

    it('does not show section headers or items in collapsed mode', () => {
      setup('/system/students');
      const headers = fixture.nativeElement.querySelectorAll('.sidebar-group-header');
      expect(headers.length).toBe(0);
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
      expect(headers.length).toBe(6); // 6 sections defined
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
