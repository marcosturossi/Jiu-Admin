import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../generated_services/api/auth.service';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string= "";

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private route: Router,
    private authServiceService: AuthServiceService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.isLoggedIn();

  }

  isLoggedIn() {
    if (this.authServiceService.isLoggedIn() == true) {
      this.route.navigate(["/system"]);
    }
  }

  sendLoginRequest() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      // Use the correct request object for the generated service
      const loginRequest = { username, password };
      this.authService.apiAuthLoginPost(loginRequest, 'body').subscribe({
        next: (result) => {
          if (result && result.access_token && result.refresh_token) {
            this.authServiceService.saveToken(result.access_token, result.refresh_token);
            this.route.navigate(['/system']);
          }
        },
        error: (err) => {
          // Tenta pegar a mensagem personalizada do backend, senão usa uma mensagem padrão
          this.error = err.error?.message || err.message || 'Erro desconhecido ao fazer login.';
        }
      });
    }
  }
}
