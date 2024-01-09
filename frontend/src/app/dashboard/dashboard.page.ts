import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chain, Gql } from '../core/types/zeus';
import { environment } from 'src/environments/environment';

import { BroadcastMode, Keplr } from "@keplr-wallet/types";
import SignClient from "@walletconnect/sign-client";
// import { KeplrQRCodeModalV2 } from "@keplr-wallet/wc-qrcode-modal";
import { KeplrWalletConnectV2 } from "@keplr-wallet/wc-client";
import { ChainService } from '../core/service/chain.service';
import { WalletService } from '../core/service/wallet.service';
import { LottieComponent } from 'ngx-lottie';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LottieComponent]
})
export class DashboardPage implements OnInit {
  errorText = "";

  constructor(private chainService: ChainService, private walletService: WalletService) {

  }

  async ngOnInit() {

  }


}
