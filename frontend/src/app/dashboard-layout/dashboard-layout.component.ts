import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import {
  IonApp,
  IonRouterOutlet,
  IonContent,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonListHeader,
  IonIcon,
  IonChip,
  IonButton,
  IonMenuToggle,
  IonAccordion,
  IonAccordionGroup,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

import { chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close, chevronForwardSharp } from "ionicons/icons";
import { addIcons } from 'ionicons';
import { WalletService } from '../core/service/wallet.service';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../core/enum/wallet-status.enum';
import { AccountData } from '@keplr-wallet/types';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { LottieComponent, LottieModule } from 'ngx-lottie';
import player from 'lottie-web';

// Note we need a separate function as it's required
// by the AOT compiler.
export function playerFactory() {
  return player;
}

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: 'dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonContent,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonRouterOutlet,
    IonList,
    IonItem,
    IonLabel,
    IonListHeader,
    IonIcon,
    IonChip,
    IonButton,
    IonMenuToggle,
    IonAccordion,
    IonAccordionGroup,
    RouterLink,
    RouterLinkActive,
    ShortenAddressPipe,
    LottieComponent
  ],
})
export class DashboardLayoutComponent {
  isWalletConnected = false;
  walletStatusText = "Connect wallet";
  connectedAccount: any = {};

  constructor(private walletService: WalletService) {
    addIcons({ chevronForward, keySharp, pencilSharp, createSharp, checkmark, closeOutline, close, chevronForwardSharp });

    this.walletService.isConnected().then((isConnected) => {
      this.isWalletConnected = isConnected;
      this.walletService.getAccount().then((account) => {
        this.connectedAccount = account;
      }).catch((err) => {
        this.isWalletConnected = false;
      });
    });
  }

  async connectWallet() {
    if (!window.keplr) {
      // TODO: Popup explaining that Keplr is needed and needs to be installed
      // first
      console.error('Keplr extension not found.');
      return;
    }
    this.walletStatusText = "Connecting...";
    let walletStatus = await this.walletService.connect();
    switch (walletStatus) {
      case WalletStatus.Connected:
        this.walletStatusText = "Connected";
        break;
      case WalletStatus.Rejected:
        // TODO: Popup to inform rejection and try again
        this.walletStatusText = "Connect wallet";
        break;
      case WalletStatus.NotInstalled:
        // TODO: Popup to install Keplr
        this.walletStatusText = "Connect wallet";
        break;
    }
  }
}
