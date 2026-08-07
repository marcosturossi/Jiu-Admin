import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import Keycloak from 'keycloak-js';

import { SystemComponent } from './system.component';

describe('SystemComponent', () => {
  let component: SystemComponent;
  let fixture: ComponentFixture<SystemComponent>;

  beforeEach(async () => {
    // Now that SystemComponent is standalone with its real imports (NavbarComponent,
    // SidebarComponent, SubnavComponent), TestBed actually instantiates them here — previously,
    // with declarations-based NgModule config + NO_ERRORS_SCHEMA, those custom elements were just
    // treated as unrecognized tags and skipped, so this Keycloak dependency never surfaced.
    const keycloakStub: Partial<Keycloak> = {};

    await TestBed.configureTestingModule({
      imports: [SystemComponent, RouterModule],
      // provideRouter (not just RouterModule) is needed now that NavbarComponent uses routerLink —
      // the RouterLink directive injects ActivatedRoute, which only a configured router provides.
      providers: [provideHttpClient(), provideRouter([]), { provide: Keycloak, useValue: keycloakStub }],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
