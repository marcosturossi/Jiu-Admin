import {Routes} from '@angular/router';
import {PageNotFoundComponent} from './pages/errors/page-not-found/page-not-found.component';
import { AuthGuard } from './guard/auth.guard';
import {LogoutComponent} from "./pages/logout/logout.component";
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {path: "system",
    loadChildren:() => import("./pages/system/system.module").then(m => m.SystemModule),
    canActivate:[AuthGuard]},
  {path: '', redirectTo: 'authentication/login', pathMatch: 'full'},
  {path: 'authentication/logout', pathMatch: 'full', component: LogoutComponent },
  {path: 'authentication/login', pathMatch: 'full', component:LoginComponent},
  {path: '404', component: PageNotFoundComponent},
  {path: '**', redirectTo:'/404'},
];

