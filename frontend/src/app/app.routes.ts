import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'inscription/:txhash',
    loadComponent: () =>
      import('./generic-viewer/generic-viewer.page').then(
        (m) => m.GenericViewerPage,
      ),
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
        path: 'wallet/token/:ticker',
        loadComponent: () =>
          import('./wallet-token/wallet-token.page').then(
            (m) => m.WalletTokenPage,
          ),
      },
      {
        path: 'wallet',
        loadComponent: () =>
          import('./wallet/wallet.component').then((m) => m.WalletPage),
      },
      {
        path: 'wallet/:address',
        loadComponent: () =>
          import('./wallet/wallet.component').then((m) => m.WalletPage),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'create/collection',
        loadComponent: () =>
          import('./create-collection/create-collection.component').then(
            (m) => m.CreateCollectionPage,
          ),
      },
      {
        path: 'create/inscription',
        loadComponent: () =>
          import('./create-inscription/create-inscription.page').then(
            (m) => m.CreateInscriptionPage,
          ),
      },
      {
        path: 'create/token',
        loadComponent: () =>
          import('./create-token/create-token.page').then(
            (m) => m.CreateTokenPage,
          ),
      },
      {
        path: 'collections',
        loadComponent: () =>
          import('./list-collections/list-collections.component').then(
            (m) => m.ListCollectionsPage,
          ),
      },
      {
        path: 'collection/:symbol',
        loadComponent: () =>
          import('./view-collection/view-collection.component').then(
            (m) => m.ViewCollectionPage,
          ),
      },
      {
        path: 'inscriptions',
        loadComponent: () =>
          import('./list-inscriptions/list-inscriptions.page').then(
            (m) => m.ListInscriptionsPage,
          ),
      },
      {
        path: 'tokens',
        loadComponent: () =>
          import('./list-tokens/list-tokens.page').then(
            (m) => m.ListTokensPage,
          ),
      },
      {
        path: 'markets',
        loadComponent: () =>
          import('./markets-token/markets-token.page').then(
            (m) => m.MarketsTokenPage,
          ),
      },
      {
        path: 'inscription-markets',
        loadComponent: () =>
          import('./markets-inscription/markets-inscription.page').then(
            (m) => m.MarketsInscriptionPage,
          ),
      },
      {
        path: 'market/:quote',
        loadComponent: () =>
          import('./swap/swap.component').then((m) => m.SwapPage),
      },
      {
        path: 'inscription/:txhash',
        loadComponent: () =>
          import('./view-inscription/view-inscription.page').then(
            (m) => m.ViewInscriptionPage,
          ),
      },
      {
        path: 'token/:ticker',
        loadComponent: () =>
          import('./view-token/view-token.page').then((m) => m.ViewTokenPage),
      },
    ],
  },
];
