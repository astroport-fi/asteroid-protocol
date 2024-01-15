import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { IonicModule, AlertController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { IonGrid, IonRow, IonCol, IonButton, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle } from '@ionic/angular/standalone';
import { Chain, Gql } from '../core/types/zeus';
import { environment } from 'src/environments/environment';

import { BroadcastMode, Keplr } from "@keplr-wallet/types";
import SignClient from "@walletconnect/sign-client";
// import { KeplrQRCodeModalV2 } from "@keplr-wallet/wc-qrcode-modal";
import { KeplrWalletConnectV2 } from "@keplr-wallet/wc-client";
import { ChainService } from '../core/service/chain.service';
import { WalletService } from '../core/service/wallet.service';
import { LottieComponent } from 'ngx-lottie';
import { ConnectedWallet } from '../core/types/connected-wallet';
import { WalletType } from '../core/enum/wallet-type';
import { WalletStatus } from '../core/enum/wallet-status.enum';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, LottieComponent, IonGrid, IonRow, IonCol, IonButton, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle]
})
export class DashboardPage implements OnInit {
  errorText = "";

  constructor(private chainService: ChainService, private walletService: WalletService, private modalCtrl: ModalController) {

  }

  async ngOnInit() {

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

    let walletStatus = await this.walletService.connect();
    switch (walletStatus) {
      case WalletStatus.Connected:
        this.walletService.getAccount().then((account) => {

          const connectedWallet: ConnectedWallet = {
            address: account.address,
            walletType: WalletType.Keplr // Only one supported for now
          }
          localStorage.setItem(environment.storage.connectedWalletKey, JSON.stringify(connectedWallet));

          // Temp hack, reload to access wallet from all components
          window.location.reload();


        }).catch((err) => {
          // TODO
        });
        break;
      case WalletStatus.Rejected:
        // TODO: Popup to inform rejection and try again
        localStorage.clear();
        break;
      case WalletStatus.NotInstalled:
        // TODO: Popup to install Keplr
        localStorage.clear();
        break;
    }
  }


}
