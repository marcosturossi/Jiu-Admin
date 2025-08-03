import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  userName:string|null = ""
  profileDropDown = false

  constructor(
    private router:Router,
    private authService: AuthServiceService,
  ){

  }
  ngOnInit(): void {
    this.setUserName()
  }

  setUserName(){
    this.userName = this.authService.getUsernameFromToken()
  }

  openProfileDropDown(){
    this.profileDropDown = !this.profileDropDown
  }

  logout(){
    this.router.navigateByUrl("authentication/logout")
  }

}
