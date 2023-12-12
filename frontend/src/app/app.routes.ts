import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    // component: HomePage
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'app',
    component: DashboardComponent,
    children: [
      {
        path: 'create',
        loadComponent: () => import('./create/create.page').then(m => m.CreatePage)
      },
    ]
  }
];
