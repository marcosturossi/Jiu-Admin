import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [RouterModule],
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  closeSidebar() {
    console.log('closeSidebar called');
    document.body.classList.remove('sidebar-open');
    
    // Also emit an event or use a service to sync with navbar
    // For now, we'll just ensure the body class is removed
    console.log('Sidebar closed from sidebar component');
  }

  closeSidebarOnMobile() {
    // Only close sidebar on mobile/tablet devices
    if (window.innerWidth < 992) {
      this.closeSidebar();
    }
  }

  navigateTo(route: string, event?: Event) {
    // Prevent event propagation to avoid closing sidebar before navigation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Navigating to:', route);
    console.log('Current URL:', this.router.url);
    
    // Navigate first, then close sidebar after a small delay to ensure navigation completes
    this.router.navigate([route]).then(success => {
      console.log('Navigation success:', success);
      if (success) {
        // Add a small delay to ensure the route change is processed
        setTimeout(() => {
          this.closeSidebarOnMobile();
        }, 100);
      }
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

}
