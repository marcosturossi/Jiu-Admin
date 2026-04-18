import {Routes} from '@angular/router';
import {PageNotFoundComponent} from './pages/errors/page-not-found/page-not-found.component';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: 'system',
    loadChildren: () => import('./pages/system/system.module').then(m => m.SystemModule),
    canActivate: [AuthGuard],
  },
  { path: '',   redirectTo: 'system', pathMatch: 'full' },
  { path: '404', component: PageNotFoundComponent },
  { path: '**',  redirectTo: '/404' },
];

