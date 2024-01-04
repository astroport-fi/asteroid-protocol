import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/types/zeus';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletService } from '../core/service/wallet.service';
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

@Component({
  selector: 'app-trade-token',
  templateUrl: './trade-token.page.html',
  styleUrls: ['./trade-token.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ShortenAddressPipe, RouterLink, DatePipe, HumanSupplyPipe, TokenDecimalsPipe]
})
export class TradeTokenPage implements OnInit {
  isLoading = false;
  token: any;
  positions: any;
  explorerTxUrl: string = environment.api.explorer;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;

  constructor(private activatedRoute: ActivatedRoute, private protocolService: CFT20Service, private modalCtrl: ModalController, private alertController: AlertController, private walletService: WalletService) {
    this.tokenLaunchDate = new Date();
  }

  async ngOnInit() {
    this.isLoading = true;

    const chain = Chain(environment.api.endpoint)
    const result = await chain('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params["ticker"].toUpperCase()
            }
          }
        }, {
          id: true,
          height: true,
          transaction: {
            hash: true
          },
          creator: true,
          current_owner: true,
          name: true,
          ticker: true,
          decimals: true,
          max_supply: true,
          per_mint_limit: true,
          launch_timestamp: true,
          content_path: true,
          content_size_bytes: true,
          circulating_supply: true,
          date_created: true,
        }
      ]
    });

    this.token = result.token[0];

    this.tokenLaunchDate = new Date(this.token.launch_timestamp * 1000);
    if (this.tokenLaunchDate.getTime() < Date.now()) {
      this.tokenIsLaunched = true;
    }

    const positionsResult = await chain('query')({
      token_open_position: [
        {
          where: {
            token_id: {
              _eq: this.token.id
            }
          }
        }, {
          id: true,
          token: {
            ticker: true,
          },
          ppt: true,
          amount: true,
          total: true,
        }
      ]
    });

    this.positions = positionsResult.token_open_position;

    this.isLoading = false;
  }

  async mint() {
    if (!this.walletService.hasWallet()) {
      // Popup explaining that Keplr is needed and needs to be installed first
      const alert = await this.alertController.create({
        header: 'Keplr wallet is required',
        message: "We're working on adding more wallet support. Unfortunately, for now you'll need to install Keplr to use this app",
        buttons: [
          {
            text: 'Get Keplr',
            cssClass: 'alert-button-success',
            handler: () => {
              window.open('https://www.keplr.app/', '_blank');
            }
          },
          {
            text: 'Cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              alert.dismiss();
            }
          }
        ],
      });
      await alert.present();
      return;
    }
    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.token.ticker],
      ["amt", this.token.per_mint_limit],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'mint', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: false,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.token.transaction.hash],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'mint',
      }
    });
    modal.present();
  }

  async buy(orderNumber: number) {
    console.log("buy" + orderNumber);





    if (!this.walletService.hasWallet()) {
      // Popup explaining that Keplr is needed and needs to be installed first
      const alert = await this.alertController.create({
        header: 'Keplr wallet is required',
        message: "We're working on adding more wallet support. Unfortunately, for now you'll need to install Keplr to use this app",
        buttons: [
          {
            text: 'Get Keplr',
            cssClass: 'alert-button-success',
            handler: () => {
              window.open('https://www.keplr.app/', '_blank');
            }
          },
          {
            text: 'Cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              alert.dismiss();
            }
          }
        ],
      });
      await alert.present();
      return;
    }

    const purchaseMessage = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: "cosmos1m857lgtjssgt0wm3crzfmt3v950vqnkqq29mmz",
        amount: [
          {
            denom: "uatom",
            amount: "275000000",
          }
        ],
      }).finish(),
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.token.ticker],
      ["ord", orderNumber],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'buy', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: false,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.token.transaction.hash],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'buy',
        messages: [purchaseMessage]
      }
    });
    modal.present();
  }

  async cancel(orderNumber: number) {
    if (!this.walletService.hasWallet()) {
      // Popup explaining that Keplr is needed and needs to be installed first
      const alert = await this.alertController.create({
        header: 'Keplr wallet is required',
        message: "We're working on adding more wallet support. Unfortunately, for now you'll need to install Keplr to use this app",
        buttons: [
          {
            text: 'Get Keplr',
            cssClass: 'alert-button-success',
            handler: () => {
              window.open('https://www.keplr.app/', '_blank');
            }
          },
          {
            text: 'Cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              alert.dismiss();
            }
          }
        ],
      });
      await alert.present();
      return;
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["tic", this.token.ticker],
      ["ord", orderNumber],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'delist', params);
    const modal = await this.modalCtrl.create({
      keyboardClose: false,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/manage/token', this.token.transaction.hash],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'delist',
      }
    });
    modal.present();

  }

}
