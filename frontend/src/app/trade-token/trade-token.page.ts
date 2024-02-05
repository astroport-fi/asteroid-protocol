import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain, Subscription } from '../core/helpers/zeus';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletService } from '../core/service/wallet.service';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { TableModule } from 'primeng/table';
import { PriceService } from '../core/service/price.service';
import { SellModalPage } from '../sell-modal/sell-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

@Component({
  selector: 'app-trade-token',
  templateUrl: './trade-token.page.html',
  styleUrls: ['./trade-token.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ShortenAddressPipe,
    RouterLink,
    DatePipe,
    HumanSupplyPipe,
    TokenDecimalsPipe,
    TableModule,
  ],
})
export class TradeTokenPage implements OnInit {
  isLoading = false;
  token: any;
  positions: any;
  explorerTxUrl: string = environment.api.explorer;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;
  baseTokenUSD: number = 0.0;
  walletAddress: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private protocolService: CFT20Service,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private walletService: WalletService,
    private priceService: PriceService
  ) {
    this.tokenLaunchDate = new Date();
  }

  async ngOnInit() {
    this.isLoading = true;

    const walletConnected = await this.walletService.isConnected();
    if (walletConnected) {
      this.walletAddress = (await this.walletService.getAccount()).address;
    }

    const chain = Chain(environment.api.endpoint);
    const result = await chain('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params['quote'].toUpperCase(),
            },
          },
        },
        {
          id: true,
          height: true,
          transaction: {
            hash: true,
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
          last_price_base: true,
          volume_24_base: true,
          date_created: true,
        },
      ],
    });

    this.token = result.token[0];

    const positionsResult = await chain('query')({
      token_open_position: [
        {
          where: {
            _and: [
              {
                token: {
                  ticker: {
                    _eq: this.activatedRoute.snapshot.params[
                      'quote'
                    ].toUpperCase(),
                  },
                },
              },
              {
                is_cancelled: {
                  _eq: false,
                },
              },
              {
                is_filled: {
                  _eq: false,
                },
              },
            ],
          },
        },
        {
          id: true,
          token: {
            ticker: true,
          },
          seller_address: true,
          ppt: true,
          amount: true,
          total: true,
          is_cancelled: false,
          is_filled: false,
        },
      ],
    });

    this.positions = positionsResult.token_open_position;

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
          base_token: true,
          base_token_usd: true,
        },
      ],
    }).on(({ status }) => {
      this.baseTokenUSD = status[0].base_token_usd;
    });

    wsChain('subscription')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params['quote'].toUpperCase(),
            },
          },
        },
        {
          id: true,
          name: true,
          ticker: true,
          decimals: true,
          content_path: true,
          last_price_base: true,
          volume_24_base: true,
        },
      ],
    }).on(({ token }) => {
      this.token = token[0];
    });

    wsChain('subscription')({
      token_open_position: [
        {
          where: {
            _and: [
              {
                token: {
                  ticker: {
                    _eq: this.activatedRoute.snapshot.params[
                      'quote'
                    ].toUpperCase(),
                  },
                },
              },
              {
                is_cancelled: {
                  _eq: false,
                },
              },
              {
                is_filled: {
                  _eq: false,
                },
              },
            ],
          },
        },
        {
          id: true,
          token: {
            ticker: true,
          },
          seller_address: true,
          ppt: true,
          amount: true,
          total: true,
          is_cancelled: false,
          is_filled: false,
        },
      ],
    }).on(({ token_open_position }) => {
      this.positions = token_open_position;
    });

    this.isLoading = false;
  }

  async buy(orderNumber: number) {
    const chain = Chain(environment.api.endpoint);
    const position = await chain('query')({
      token_open_position: [
        {
          where: {
            id: {
              _eq: orderNumber,
            },
          },
        },
        {
          id: true,
          token: {
            ticker: true,
          },
          seller_address: true,
          ppt: true,
          amount: true,
          total: true,
          is_cancelled: true,
          is_filled: true,
        },
      ],
    });

    // TODO: If cancelled or filled, show error message

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

    const totaluatom: bigint = position.token_open_position[0].total as bigint;

    const purchaseMessage = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: position.token_open_position[0].seller_address,
        amount: [
          {
            denom: 'uatom',
            amount: totaluatom.toString(),
          },
        ],
      }).finish(),
    };

    const purchaseMessageJSON = {
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      from_address: (await this.walletService.getAccount()).address,
      to_address: position.token_open_position[0].seller_address,
      amount: [
        {
          denom: 'uatom',
          amount: totaluatom.toString(),
        },
      ],
    };

    // Calculate the trading fee
    let overrideFee = environment.fees.protocol.cft20.buy.amount;
    if (environment.fees.protocol.cft20.buy.type == 'dynamic-percent') {
      const feePercentage = parseFloat(
        environment.fees.protocol.cft20.buy.amount
      );
      const fee = parseInt(totaluatom.toString()) * feePercentage;
      overrideFee = fee.toString();
      console.log('overrideFee', overrideFee);
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ['tic', this.token.ticker],
      ['ord', orderNumber],
    ]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'buy',
      params
    );
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/wallet/token', this.token.ticker],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'buy',
        messages: [purchaseMessage],
        messagesJSON: [purchaseMessageJSON],
        overrideFee,
      },
    });
    modal.present();
  }

  async cancel(orderNumber: number) {
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

    // Construct metaprotocol memo message
    const params = new Map([
      ['tic', this.token.ticker],
      ['ord', orderNumber],
    ]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'delist',
      params
    );
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/wallet/token', this.token.ticker],
        resultCTA: 'View transaction',
        metaprotocol: 'cft20',
        metaprotocolAction: 'delist',
      },
    });
    modal.present();
  }

  async listSale() {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: SellModalPage,

      componentProps: {
        ticker: this.token.ticker,
      },
    });
    modal.present();
  }
}
