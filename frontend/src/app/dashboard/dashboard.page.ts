import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { IonicModule, AlertController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonGrid,
  IonHeader,
  IonMenuButton,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { BroadcastMode, Keplr } from '@keplr-wallet/types';
// import { KeplrQRCodeModalV2 } from "@keplr-wallet/wc-qrcode-modal";
import { KeplrWalletConnectV2 } from '@keplr-wallet/wc-client';
import SignClient from '@walletconnect/sign-client';
import { LottieComponent } from 'ngx-lottie';
import { environment } from 'src/environments/environment';
import { WalletStatus } from '../core/enum/wallet-status.enum';
import { WalletType } from '../core/enum/wallet-type';
import { ChainService } from '../core/service/chain.service';
import { WalletService } from '../core/service/wallet.service';
import { ConnectedWallet } from '../core/types/connected-wallet';
import { Chain, Gql } from '../core/types/zeus';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';
import { WalletSelectionModalPage } from '../wallet-selection-modal/wallet-selection-modal.page';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LottieComponent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
  ],
})
export class DashboardPage implements OnInit {
  errorText = '';

  constructor(
    private chainService: ChainService,
    private walletService: WalletService,
    private modalCtrl: ModalController,
  ) {}

  async ngOnInit() {}

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
}
