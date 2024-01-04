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
        path: 'inscriptions',
        loadComponent: () => import('./list-inscriptions/list-inscriptions.page').then(m => m.ListInscriptionsPage)
      },
      {
        path: 'manage/token/:txhash',
        loadComponent: () => import('./manage-token/manage-token.page').then(m => m.ManageTokenPage)
      },
      {
        path: 'wallet/:address',
        loadComponent: () => import('./wallet/wallet.page').then(m => m.WalletPage)
      },
      {
        path: 'tokens',
        loadComponent: () => import('./list-tokens/list-tokens.page').then(m => m.ListTokensPage)
      },
      {
        path: 'trade/tokens',
        loadComponent: () => import('./trade-tokens/trade-tokens.page').then(m => m.TradeTokensPage)
      },
      {
        path: 'trade/:ticker',
        loadComponent: () => import('./trade-token/trade-token.page').then(m => m.TradeTokenPage)
      },
      {
        path: 'inscription/:txhash',
        loadComponent: () => import('./view-inscription/view-inscription.page').then(m => m.ViewInscriptionPage)
      },
      {
        path: 'token/:ticker',
        loadComponent: () => import('./view-token/view-token.page').then(m => m.ViewTokenPage)
      },
    ]
  }
];
