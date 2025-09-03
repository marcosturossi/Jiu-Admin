import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../generated_services/api/auth.service';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string = "";
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private route: Router,
    private authServiceService: AuthServiceService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.isLoggedIn();
  }

  isLoggedIn() {
    if (this.authServiceService.isLoggedIn() == true) {
      this.route.navigate(["/system"]);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  sendLoginRequest() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = "";
      
      const { username, password } = this.loginForm.value;
      const loginRequest = { username, password };
      
      this.authService.apiAuthLoginPost(loginRequest, 'body').subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result && result.access_token && result.refresh_token) {
            this.authServiceService.saveToken(result.access_token, result.refresh_token);
            this.route.navigate(['/system']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.error?.message || err.message || 'Erro ao fazer login. Verifique suas credenciais.';
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
