import {Component, OnInit} from '@angular/core';
import { AuthService} from "../../generated_services/api/auth.service"
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
    selector: 'app-logout',
    imports: [RouterLink, RouterOutlet],
    templateUrl: './logout.component.html',
    styleUrl: './logout.component.scss'
})
export class LogoutComponent implements OnInit{
  constructor(
    private authService: AuthService,
    private authServiceService: AuthServiceService,
  ) {
  }

  ngOnInit(): void {
    this.authService.apiAuthLogoutPost()
    this.authServiceService.clearToken()
  }

}
