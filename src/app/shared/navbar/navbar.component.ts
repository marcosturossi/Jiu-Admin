import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  userName:string|null = ""
  profileDropDown = false
  sidebarOpen = false

  constructor(
    private router:Router,
    private authService: AuthServiceService,
  ){

  }
  ngOnInit(): void {
    this.setUserName()
    
    // Listen for sidebar state changes
    this.checkSidebarState()
  }
  
  checkSidebarState() {
    // Check if sidebar is open by looking at body class
    const observer = new MutationObserver(() => {
      this.sidebarOpen = document.body.classList.contains('sidebar-open');
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  setUserName(){
    this.userName = this.authService.getUsernameFromToken()
  }

  openProfileDropDown(){
    this.profileDropDown = !this.profileDropDown
  }

  toggleSidebar(){
    // Toggle sidebar visibility by adding/removing CSS class to body
    this.sidebarOpen = !this.sidebarOpen;
    
    console.log('Toggle sidebar clicked. New state:', this.sidebarOpen);
    
    if (this.sidebarOpen) {
      document.body.classList.add('sidebar-open');
      console.log('Added sidebar-open class to body');
    } else {
      document.body.classList.remove('sidebar-open');
      console.log('Removed sidebar-open class from body');
    }
    
    console.log('Current body classes:', document.body.className);
    console.log('Sidebar element:', document.querySelector('.sidebar'));
  }

  logout(){
    this.router.navigateByUrl("authentication/logout")
  }

}
