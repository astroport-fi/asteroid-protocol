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


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DashboardPage implements OnInit {
  errorText = "";

  constructor() {

  }

  async ngOnInit() {
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      transaction: [
        {}, {
          id: true,
          hash: true,
        }
      ]
    });

    for (const tx of result.transaction) {
      console.log(tx.id, tx.hash);
    }

  }

  async connectWC() {
    console.log("SIGNCLIENT");
    const signClient = await SignClient.init({
      // If do you have your own project id, you can set it.
      projectId: "8d611785b5b4298436793509ca6198df",
      metadata: {
        name: "WC Test Dapp",
        description: "WC Test Dapp",
        url: "http://localhost:1234/",
        icons: [
          "https://raw.githubusercontent.com/chainapsis/keplr-wallet/master/packages/extension/src/public/assets/logo-256.png",
        ],
      },
    });

    let keplr: any = null;

    if (signClient.session.getAll().length <= 0) {
      console.log("connect now");
      // const modal = new KeplrQRCodeModalV2(signClient);

      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          cosmos: {
            methods: [
              "cosmos_getAccounts",
              "cosmos_signDirect",
              "cosmos_signAmino",
              "keplr_getKey",
              "keplr_signAmino",
              "keplr_signDirect",
              "keplr_signArbitrary",
              "keplr_enable",
            ],
            chains: [`cosmos:cosmoshub-4`],
            events: ["accountsChanged", "chainChanged", "keplr_accountsChanged"],
          },
        },
      });

      if (!uri) {
        throw new Error("No uri");
      } else {
        console.log("URI", uri);
        // document.location.href = uri;
        this.errorText = uri;
        document.location.href = `keplrwallet://wcV2?${uri}`;
        const session = await approval();
        console.log("SESSION", session);
        this.errorText = JSON.stringify(session);
      }

      // You can pass the chain ids that you want to connect to the modal.
      // const sessionProperties = await modal.connect(["cosmoshub-4"]);

      keplr = new KeplrWalletConnectV2(signClient, {
        // sendTx,
      });

      console.log(keplr);

    } else {
      console.log("NONE?");
    }
  }
}
