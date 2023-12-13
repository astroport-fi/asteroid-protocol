import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'app',
    component: DashboardLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'create',
        loadComponent: () => import('./create/create.page').then(m => m.CreatePage)
      },
      {
        path: 'create/content',
        loadComponent: () => import('./create-content/create-content.page').then(m => m.CreateContentPage)
      },
      {
        path: 'browse',
        loadComponent: () => import('./browse/browse.page').then(m => m.BrowsePage)
      },
    ]
  }
];
