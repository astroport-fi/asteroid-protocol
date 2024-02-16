import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { SortEvent } from 'primeng/api';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { BuyWizardModalPage } from '../buy-wizard-modal/buy-wizard-modal.page';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { PriceService } from '../core/service/price.service';
import { WalletService } from '../core/service/wallet.service';
import { Chain, Subscription, order_by } from '../core/types/zeus';
import { SellModalPage } from '../sell-modal/sell-modal.page';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

@Component({
  selector: 'app-trade-token-v2',
  templateUrl: './trade-token-v2.page.html',
  styleUrls: ['./trade-token-v2.page.scss'],
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
    DateAgoPipe,
  ],
})
export class TradeTokenV2Page implements OnInit {
  isLoading = false;
  token: any;
  listings: any;
  depositedListings: any;
  explorerTxUrl: string = environment.api.explorer;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;
  baseTokenUSD: number = 0.0;
  walletAddress: string = '';
  currentBlock: number = 0;
  limit: number = 2000;
  isTableLoading: boolean = true;
  chain: any;
  total: number = 1000;

  constructor(
    private activatedRoute: ActivatedRoute,
    private protocolService: MarketplaceService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private walletService: WalletService,
    private priceService: PriceService,
  ) {
    this.tokenLaunchDate = new Date();
    this.chain = Chain(environment.api.endpoint);
  }

  async ngOnInit() {
    this.isLoading = true;

    const walletConnected = await this.walletService.isConnected();
    if (walletConnected) {
      this.walletAddress = (await this.walletService.getAccount()).address;
    }

    const result = await this.chain('query')({
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
          launch_timestamp: true,
          content_path: true,
          circulating_supply: true,
          last_price_base: true,
          volume_24_base: true,
          date_created: true,
        },
      ],
    });
    this.token = result.token[0];

    const statusResult = await this.chain('query')({
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
          last_processed_height: true,
        },
      ],
    });
    this.baseTokenUSD = statusResult.status[0].base_token_usd;
    this.currentBlock = statusResult.status[0].last_processed_height;

    const depositListingsResult = await this.chain('query')({
      marketplace_cft20_detail: [
        {
          where: {
            token_id: {
              _eq: this.token.id,
            },
            marketplace_listing: {
              is_cancelled: {
                _eq: false,
              },
              is_filled: {
                _eq: false,
              },
              is_deposited: {
                _eq: true,
              },
              depositor_address: {
                _eq: this.walletAddress,
              },
              depositor_timedout_block: {
                _gt: this.currentBlock,
              },
            },
          },
          limit: this.limit,
          order_by: [
            {
              ppt: order_by.asc,
            },
          ],
        },
        {
          id: true,
          marketplace_listing: {
            id: true,
            seller_address: true,
            total: true,
            depositor_address: true,
            is_deposited: true,
            depositor_timedout_block: true,
            deposit_total: true,
            transaction: {
              hash: true,
            },
          },
          ppt: true,
          amount: true,
          date_created: true,
        },
      ],
    });
    this.depositedListings = depositListingsResult.marketplace_cft20_detail;

    const wsChain = Subscription(environment.api.wss);
    wsChain('subscription')({
      marketplace_cft20_detail: [
        {
          where: {
            token_id: {
              _eq: this.token.id,
            },
            marketplace_listing: {
              is_cancelled: {
                _eq: false,
              },
              is_filled: {
                _eq: false,
              },
            },
          },
          limit: this.limit,
          order_by: [
            {
              ppt: order_by.asc,
            },
          ],
        },
        {
          id: true,
          marketplace_listing: {
            id: true,
            seller_address: true,
            total: true,
            depositor_address: true,
            is_deposited: true,
            depositor_timedout_block: true,
            deposit_total: true,
            transaction: {
              hash: true,
            },
          },
          ppt: true,
          amount: true,
          date_created: true,
        },
      ],
    }).on(({ marketplace_cft20_detail }) => {
      this.listings = marketplace_cft20_detail;
    });

    wsChain('subscription')({
      marketplace_cft20_detail: [
        {
          where: {
            token_id: {
              _eq: this.token.id,
            },
            marketplace_listing: {
              is_cancelled: {
                _eq: false,
              },
              is_filled: {
                _eq: false,
              },
              is_deposited: {
                _eq: true,
              },
              depositor_address: {
                _eq: this.walletAddress,
              },
              depositor_timedout_block: {
                _gt: this.currentBlock,
              },
            },
          },
          limit: this.limit,
          order_by: [
            {
              ppt: order_by.asc,
            },
          ],
        },
        {
          id: true,
          marketplace_listing: {
            id: true,
            seller_address: true,
            total: true,
            depositor_address: true,
            is_deposited: true,
            depositor_timedout_block: true,
            deposit_total: true,
            transaction: {
              hash: true,
            },
          },
          ppt: true,
          amount: true,
          date_created: true,
        },
      ],
    }).on(({ marketplace_cft20_detail }) => {
      this.depositedListings = marketplace_cft20_detail;
    });

    wsChain('subscription')({
      status: [
        {},
        {
          last_processed_height: true,
          last_known_height: true,
        },
      ],
    }).on(({ status }) => {
      this.currentBlock = status[0].last_processed_height;
    });
    this.isLoading = false;
  }

  async deposit(listingHash: string) {
    const modal = await this.modalCtrl.create({
      // keyboardClose: true,
      // backdropDismiss: false,
      component: BuyWizardModalPage,
      componentProps: {
        hash: listingHash,
        metaprotocol: 'marketplace',
        metaprotocolAction: 'deposit',
      },
    });
    modal.present();

    // const chain = Chain(environment.api.endpoint)
    // const listingResult = await chain('query')({
    //   marketplace_listing: [
    //     {
    //       where: {
    //         transaction: {
    //           hash: {
    //             _eq: listingHash
    //           }
    //         }
    //       }
    //     }, {
    //       seller_address: true,
    //       total: true,
    //       deposit_total: true,
    //       is_deposited: true,
    //       is_cancelled: true,
    //       is_filled: true,
    //     }
    //   ]
    // });

    // if (listingResult.marketplace_listing.length == 0) {
    //   alert("Listing not found");
    //   return;
    // }
    // const listing = listingResult.marketplace_listing[0];

    // const deposit: bigint = listing.deposit_total as bigint;

    // const purchaseMessage = {
    //   typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    //   value: MsgSend.encode({
    //     fromAddress: (await this.walletService.getAccount()).address,
    //     toAddress: listing.seller_address,
    //     amount: [
    //       {
    //         denom: "uatom",
    //         amount: deposit.toString(),
    //       }
    //     ],
    //   }).finish(),
    // }

    // const purchaseMessageJSON = {
    //   '@type': "/cosmos.bank.v1beta1.MsgSend",
    //   from_address: (await this.walletService.getAccount()).address,
    //   to_address: listing.seller_address,
    //   amount: [
    //     {
    //       denom: "uatom",
    //       amount: deposit.toString(),
    //     }
    //   ],
    // }

    // // Construct metaprotocol memo message
    // const params = new Map([
    //   ["h", listingHash],
    // ]);
    // const urn = this.protocolService.buildURN(environment.chain.chainId, 'deposit', params);
    // const modal = await this.modalCtrl.create({
    //   keyboardClose: true,
    //   backdropDismiss: false,
    //   component: TransactionFlowModalPage,
    //   componentProps: {
    //     urn,
    //     metadata: null,
    //     data: null,
    //     routerLink: ['/app/market', this.token.ticker],
    //     resultCTA: 'Back to market',
    //     metaprotocol: 'marketplace',
    //     metaprotocolAction: 'deposit',
    //     messages: [purchaseMessage],
    //     messagesJSON: [purchaseMessageJSON],
    //   }
    // });
    // modal.present();
  }

  async buy(listingHash: string) {
    const chain = Chain(environment.api.endpoint);
    const listingResult = await chain('query')({
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: listingHash,
              },
            },
          },
        },
        {
          seller_address: true,
          total: true,
          deposit_total: true,
          is_deposited: true,
          is_cancelled: true,
          is_filled: true,
        },
      ],
    });

    if (listingResult.marketplace_listing.length == 0) {
      alert('Listing not found');
      return;
    }
    const listing = listingResult.marketplace_listing[0];

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

    let totaluatom: bigint = listing.total as bigint;
    const deposit: bigint = listing.deposit_total as bigint;
    if (deposit > totaluatom) {
      // If deposit is greater than total, then just sent 1uatom to complete the transaction
      totaluatom = BigInt(1);
    } else {
      // Subtract deposit amount already sent
      totaluatom -= deposit;
    }
    let decimalTotal =
      parseFloat(totaluatom.toString()) / 10 ** this.token.decimals;

    const purchaseMessage = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: listing.seller_address,
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
      to_address: listing.seller_address,
      amount: [
        {
          denom: 'uatom',
          amount: totaluatom.toString(),
        },
      ],
    };

    // Calculate the trading fee
    let overrideFee = (
      environment.fees.protocol.marketplace['buy.cft20'] as any
    ).amount;
    if (
      (environment.fees.protocol.marketplace['buy.cft20'] as any).type ==
      'dynamic-percent'
    ) {
      const feePercentage = parseFloat(
        (environment.fees.protocol.marketplace['buy.cft20'] as any).amount,
      );
      let fee = decimalTotal * feePercentage;
      if (fee < 0.000001) {
        fee = 0.000001;
      }
      fee = fee * 10 ** this.token.decimals;
      overrideFee = fee.toFixed(0);
    }

    // Construct metaprotocol memo message
    const params = new Map([['h', listingHash]]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'buy.cft20',
      params,
    );
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/market', this.token.ticker],
        resultCTA: 'Back to market',
        metaprotocol: 'marketplace',
        metaprotocolAction: 'buy.cft20',
        messages: [purchaseMessage],
        messagesJSON: [purchaseMessageJSON],
        overrideFee,
      },
    });
    modal.present();
  }

  async cancel(listingHash: string) {
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
    const params = new Map([['h', listingHash]]);
    const urn = this.protocolService.buildURN(
      environment.chain.chainId,
      'delist',
      params,
    );
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: false,
      component: TransactionFlowModalPage,
      componentProps: {
        urn,
        metadata: null,
        data: null,
        routerLink: ['/app/market', this.token.ticker],
        resultCTA: 'Back to market',
        metaprotocol: 'marketplace',
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

  customSort(event: SortEvent) {
    if (event.field == 'marketplace_listing.total') {
      event.data?.sort((data1, data2) => {
        let value1 = parseInt(data1['marketplace_listing'].total);
        let value2 = parseInt(data2['marketplace_listing'].total);
        let result = null;

        if (value1 == null && value2 != null) result = -1;
        else if (value1 != null && value2 == null) result = 1;
        else if (value1 == null && value2 == null) result = 0;
        else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

        return (event.order as number) * result;
      });
    }
    if (event.field == 'marketplace_listing.deposit_total') {
      event.data?.sort((data1, data2) => {
        let value1 =
          parseInt(data1['marketplace_listing'].deposit_total) /
          parseInt(data1['marketplace_listing'].total);
        let value2 =
          parseInt(data2['marketplace_listing'].deposit_total) /
          parseInt(data2['marketplace_listing'].total);
        let result = null;

        if (value1 == null && value2 != null) result = -1;
        else if (value1 != null && value2 == null) result = 1;
        else if (value1 == null && value2 == null) result = 0;
        else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

        return (event.order as number) * result;
      });
    }

    event.data?.sort((data1, data2) => {
      let value1 = data1[event.field as string];
      let value2 = data2[event.field as string];
      let result = null;

      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string')
        result = value1.localeCompare(value2);
      else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

      return (event.order as number) * result;
    });
  }

  async load(event: TableLazyLoadEvent) {
    this.isTableLoading = true;

    // Determine the sort order
    let sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Build the order_by clause based on the event.sortField and sortOrder
    let orderByClause: any = {};
    if (event.sortField) {
      if (event.sortField == 'marketplace_listing.total') {
        orderByClause = {
          marketplace_listing: {
            total: sortOrder,
          },
        };
      } else if (event.sortField == 'marketplace_listing.deposit_total') {
        orderByClause = {
          marketplace_listing: {
            deposit_total: sortOrder,
          },
        };
      } else {
        orderByClause[event.sortField as string] = sortOrder;
      }
    } else {
      // Default sorting, if no sortField is provided
      orderByClause = { ppt: 'asc' };
    }

    const listingsResult = await this.chain('query')({
      marketplace_cft20_detail: [
        {
          where: {
            token_id: {
              _eq: this.token.id,
            },
            marketplace_listing: {
              is_cancelled: {
                _eq: false,
              },
              is_filled: {
                _eq: false,
              },
            },
          },
          offset: event.first,
          limit: event.rows,
          order_by: [orderByClause],
        },
        {
          id: true,
          marketplace_listing: {
            seller_address: true,
            total: true,
            depositor_address: true,
            is_deposited: true,
            depositor_timedout_block: true,
            deposit_total: true,
            transaction: {
              hash: true,
            },
          },
          ppt: true,
          amount: true,
          date_created: true,
        },
      ],
    });
    this.listings = listingsResult.marketplace_cft20_detail;

    this.isTableLoading = false;
  }
}
