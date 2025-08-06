import {CanActivateFn} from "@angular/router";
import {inject} from "@angular/core";
import { AuthServiceService } from "../services/auth-service.service";


export const AuthGuard: CanActivateFn = (): boolean => {
  const authenticationService = inject(AuthServiceService);
  if (
    authenticationService.isLoggedIn() &&
    authenticationService.hasRole("manage-realm") &&
    authenticationService.hasRole("manage-users")) {
    return true;
  }
  authenticationService.redirectToLogin();
  return false;
};
