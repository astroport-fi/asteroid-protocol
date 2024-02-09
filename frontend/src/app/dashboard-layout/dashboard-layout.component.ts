import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
  IonAccordion,
  IonAccordionGroup,
  IonApp,
  IonButton,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonRow,
  IonSplitPane,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmark,
  chevronDown,
  chevronForward,
  chevronForwardSharp,
  close,
  closeOutline,
  createSharp,
  eyeOffOutline,
  keySharp,
  openOutline,
  pencilSharp,
  searchOutline,
} from 'ionicons/icons';
import player from 'lottie-web';
import { LottieComponent, LottieModule } from 'ngx-lottie';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { environment } from 'src/environments/environment';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { WalletService } from '../core/service/wallet.service';
import { ConnectedWallet } from '../core/types/connected-wallet';
import { Subscription } from '../core/types/zeus';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';
import { WalletSelectionModalPage } from '../wallet-selection-modal/wallet-selection-modal.page';

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
    IonGrid,
    IonRow,
    IonCol,
    RouterLink,
    RouterLinkActive,
    NgScrollbarModule,
    ShortenAddressPipe,
    LottieComponent,
  ],
})
export class DashboardLayoutComponent {
  showWalletOptions = false;
  isWalletConnected = false;
  walletStatusText = 'Connect wallet';
  connectedAccount: any = {};
  maxHeight: number = 0;
  currentHeight: number = 0;
  lag: number = 0;

  constructor(
    private walletService: WalletService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      chevronForward,
      keySharp,
      pencilSharp,
      createSharp,
      checkmark,
      closeOutline,
      close,
      chevronForwardSharp,
      chevronDown,
      searchOutline,
      openOutline,
      eyeOffOutline,
    });
  }

  async ngOnInit() {
    const walletDataJSON = localStorage.getItem(
      environment.storage.connectedWalletKey,
    );
    if (walletDataJSON) {
      const walletData: ConnectedWallet = JSON.parse(walletDataJSON);
      this.walletService.setProvider(walletData.walletType);
      this.walletService.getAccount().then((account) => {
        this.isWalletConnected = true;
        this.connectedAccount = account;
      });

      // Keep an eye out for changes in the connected wallet
      // This would be the way to do it, but instead we're doing something simpler for now
      // this.walletService.walletChanged.subscribe((account: AccountData) => {
      //   this.connectedAccount = account;
      // });

      const checkInterval = setInterval(async () => {
        const selectedAccount = await this.walletService.getAccount();
        if (selectedAccount.address !== this.connectedAccount.address) {
          clearInterval(checkInterval);
          this.toastController
            .create({
              message: 'Wallet change detected, reloading account...',
              duration: 10000,
              position: 'middle',
              translucent: true,
            })
            .then(async (toast) => {
              await toast.present();
              setTimeout(() => {
                document.location.reload();
              }, 1000);
            });
        }
      }, 1000);
    } else {
      console.log('No last known wallet');
    }

    // Subscribe to indexer updates
    const wsChain = Subscription(environment.api.wss);
    wsChain('subscription')({
      status: [
        {
          where: {
            chain_id: {
              _eq: environment.chain.chainId,
            },
          },
        },
        {
          last_processed_height: true,
          last_known_height: true,
        },
      ],
    }).on(({ status }) => {
      this.maxHeight = status[0].last_known_height!;
      this.currentHeight = status[0].last_processed_height;
      this.lag = this.maxHeight - this.currentHeight;
    });
  }

  async connectWallet() {
    if (!this.walletService.hasWallet()) {
      // Popup explaining that Keplr is needed and needs to be installed first
      const modal = await this.modalCtrl.create({
        keyboardClose: true,
        backdropDismiss: true,
        component: WalletRequiredModalPage,
        cssClass: 'wallet-required-modal',
      });
      modal.present();

      return;
    }

    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: WalletSelectionModalPage,
      cssClass: 'wallet-selection-modal',
    });
    modal.present();
  }

  toggleWalletOptions() {
    this.showWalletOptions = !this.showWalletOptions;
  }

  async disconnectWallet() {
    this.walletService.disconnect();
    this.isWalletConnected = false;
    this.walletStatusText = 'Connect wallet';
    this.connectedAccount = {};
    localStorage.clear();
    // Temp hack, reload to disconnect wallet from all components
    window.location.reload();
  }
}
