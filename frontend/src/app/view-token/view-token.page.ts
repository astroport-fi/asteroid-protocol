import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { PriceService } from '../core/service/price.service';
import { WalletService } from '../core/service/wallet.service';
import { Chain, Subscription, order_by } from '../core/types/zeus';
import { SellModalPage } from '../sell-modal/sell-modal.page';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { TransferModalPage } from '../transfer-modal/transfer-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

@Component({
  selector: 'app-view-token',
  templateUrl: './view-token.page.html',
  styleUrls: ['./view-token.page.scss'],
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
export class ViewTokenPage implements OnInit {
  isLoading = false;
  token: any;
  holding: any;
  holders: any[] = [];
  explorerTxUrl: string = environment.api.explorer;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;
  selectedSection: string = 'holders';
  walletConnected: boolean = false;
  baseTokenUSD: number = 0.0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private protocolService: CFT20Service,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private walletService: WalletService,
    private priceService: PriceService,
    private titleService: Title,
    private meta: Meta
  ) {
    this.tokenLaunchDate = new Date();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.selectedSection =
      this.activatedRoute.snapshot.queryParams['section'] || 'holders';
    this.walletConnected = await this.walletService.isConnected();

    this.baseTokenUSD = await this.priceService.fetchBaseTokenUSDPrice();

    const chain = Chain(environment.api.endpoint);
    const result = await chain('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params['ticker'].toUpperCase(),
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
          last_price_base: true,
          content_path: true,
          content_size_bytes: true,
          circulating_supply: true,
          date_created: true,
        },
      ],
    });

    this.token = result.token[0];

    const { name, ticker, content_path, id, transaction } = this.token;
    const title = `${ticker} | ${name} | on Asteroid Protocol` as string;

    this.titleService.setTitle(title);
    this.meta.updateTag({
      property: 'og:url',
      content: `https://asteroidprotocol.io/app/inscription/${transaction.hash}`,
    });
    this.meta.updateTag({
      property: 'og:title',
      content: title,
    });
    this.meta.updateTag({
      property: 'og:image',
      content: content_path,
    });
    this.meta.updateTag({
      property: 'og:description',
      content: `${ticker} | CFT-20 Token #${id} on Asteroid Protocol`,
    });
    this.meta.updateTag({
      name: 'description',
      content: `${ticker} | CFT-20 Token #${id} on Asteroid Protocol`,
    });
    this.meta.updateTag({
      property: 'twitter:url',
      content: `https://asteroidprotocol.io/app/inscription/${transaction.hash}`,
    });
    this.meta.updateTag({
      property: 'twitter:title',
      content: title,
    });
    this.meta.updateTag({
      property: 'twitter:image',
      content: content_path,
    });
    this.meta.updateTag({
      property: 'twitter:description',
      content: `${ticker} | CFT-20 Token #${id} on Asteroid Protocol`,
    });
    this.meta.updateTag({
      property: 'twitter:card',
      content: 'summary',
    });

    this.tokenLaunchDate = new Date(this.token.launch_timestamp * 1000);
    if (this.tokenLaunchDate.getTime() < Date.now()) {
      this.tokenIsLaunched = true;
    }

    if (this.walletConnected) {
      const wsChain = Subscription(environment.api.wss);
      wsChain('subscription')({
        token_holder: [
          {
            where: {
              address: {
                _eq: (await this.walletService.getAccount()).address,
              },
              token_id: {
                _eq: this.token.id,
              },
            },
          },
          {
            id: true,
            token: {
              ticker: true,
              content_path: true,
              max_supply: true,
              circulating_supply: true,
              decimals: true,
              transaction: {
                hash: true,
              },
            },
            amount: true,
            date_updated: true,
          },
        ],
      }).on(({ token_holder }) => {
        if (token_holder.length > 0) {
          this.holding = token_holder[0];
        } else {
          this.holding = { amount: 0 };
        }
      });
    }

    this.isLoading = false;

    const allHolderResult = await chain('query')({
      token_holder: [
        {
          offset: 0,
          limit: 100,
          order_by: [
            {
              amount: order_by.desc_nulls_last,
            },
          ],
          where: {
            token_id: {
              _eq: this.token.id,
            },
            amount: {
              _gt: 0,
            },
          },
        },
        {
          id: true,
          address: true,
          token: {
            decimals: true,
          },
          amount: true,
          date_updated: true,
        },
      ],
    });
    this.holders = allHolderResult.token_holder;
  }

  async mint() {
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
      ['amt', this.token.per_mint_limit],
    ]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'mint',
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
        metaprotocolAction: 'mint',
      },
    });
    modal.present();
  }

  sectionChanged($event: any) {
    this.selectedSection = $event.detail.value;
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

  async transfer() {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: TransferModalPage,

      componentProps: {
        ticker: this.token.ticker,
      },
    });
    modal.present();
  }
}
