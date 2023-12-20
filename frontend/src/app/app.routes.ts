import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'mint/:ticker',
    loadComponent: () => import('./mint/mint.page').then((m) => m.MintPage),
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
        path: 'my-inscriptions',
        loadComponent: () => import('./my-inscriptions/my-inscriptions.page').then(m => m.MyInscriptionsPage)
      },
      {
        path: 'my-tokens',
        loadComponent: () => import('./my-tokens/my-tokens.page').then(m => m.MyTokensPage)
      },
      {
        path: 'create',
        loadComponent: () => import('./create/create.page').then(m => m.CreatePage)
      },
      {
        path: 'create/inscription',
        loadComponent: () => import('./create-inscription/create-inscription.page').then(m => m.CreateInscriptionPage)
      },
      {
        path: 'create/token',
        loadComponent: () => import('./create-token/create-token.page').then(m => m.CreateTokenPage)
      },
      {
        path: 'create/alter-ego',
        loadComponent: () => import('./create-alter-ego/create-alter-ego.page').then(m => m.CreateAlterEgoPage)
      },
      {
        path: 'browse',
        loadComponent: () => import('./browse/browse.page').then(m => m.BrowsePage)
      },
      {
        path: 'inscription/:txhash',
        loadComponent: () => import('./view-inscription/view-inscription.page').then(m => m.ViewInscriptionPage)
      },
    ]
  }
];
