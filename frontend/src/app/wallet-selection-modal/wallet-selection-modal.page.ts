import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { WalletType } from '../core/enum/wallet-type';
import { WalletService } from '../core/service/wallet.service';
import { WalletStatus } from '../core/enum/wallet-status.enum';
import { ConnectedWallet } from '../core/types/connected-wallet';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-wallet-selection-modal',
  templateUrl: './wallet-selection-modal.page.html',
  styleUrls: ['./wallet-selection-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterLink,
  ],
})
export class WalletSelectionModalPage implements OnInit {
  isWalletConnecting = false;
  walletStatusText = 'Connect to a wallet';
  WalletType = WalletType;

  constructor(
    private modalCtrl: ModalController,
    private walletService: WalletService
  ) {}

  async ngOnInit() {}

  async connectSelectedWallet(walletType: WalletType) {
    this.walletStatusText = 'Connecting...';
    this.isWalletConnecting = true;
    let walletStatus = await this.walletService.connect(walletType);
    switch (walletStatus) {
      case WalletStatus.Connected:
        this.walletStatusText = 'Connected';
        this.walletService
          .getAccount()
          .then((account) => {
            const connectedWallet: ConnectedWallet = {
              address: account.address,
              walletType,
            };
            localStorage.setItem(
              environment.storage.connectedWalletKey,
              JSON.stringify(connectedWallet)
            );

            // Temp hack, reload to access wallet from all components
            window.location.reload();
          })
          .catch((err) => {
            this.isWalletConnecting = false;
          });
        break;
      case WalletStatus.Rejected:
        console.log('Keplr rejected');
        // TODO: Popup to inform rejection and try again
        this.walletStatusText = 'Connect wallet';
        localStorage.clear();
        break;
      case WalletStatus.NotInstalled:
        console.log('Keplr not installed');
        // TODO: Popup to install Keplr
        this.walletStatusText = 'Connect wallet';
        localStorage.clear();
        break;
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
