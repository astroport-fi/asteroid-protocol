import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain, Subscription } from '../core/types/zeus';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { CFT20Service } from '../core/metaprotocol/cft20.service';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletService } from '../core/service/wallet.service';
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { TableModule } from 'primeng/table';
import { PriceService } from '../core/service/price.service';
import { SellModalPage } from '../sell-modal/sell-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-trade-token-tv',
  templateUrl: './trade-token-tv.page.html',
  styleUrls: ['./trade-token-tv.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ShortenAddressPipe, RouterLink, DatePipe, HumanSupplyPipe, TokenDecimalsPipe, TableModule, DropdownModule]
})
export class TradeTokenTVPage implements OnInit {
  isLoading = false;
  token: any;
  listings: any;
  explorerTxUrl: string = environment.api.explorer;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;
  baseTokenUSD: number = 0.00;
  walletAddress: string = '';
  markets: any[] = [];
  selectedMarket: any;

  constructor(private activatedRoute: ActivatedRoute, private protocolService: MarketplaceService, private modalCtrl: ModalController, private alertController: AlertController, private walletService: WalletService, private priceService: PriceService) {
    this.tokenLaunchDate = new Date();
  }

  async ngOnInit() {
    this.isLoading = true;

    const walletConnected = await this.walletService.isConnected();
    if (walletConnected) {
      this.walletAddress = (await this.walletService.getAccount()).address;
    }

    const chain = Chain(environment.api.endpoint)
    const marketsResult = await chain('query')({
      token: [
        {

        }, {
          id: true,
          name: true,
          ticker: true,
          decimals: true,
          content_path: true,
        }
      ]
    });
    this.markets = marketsResult.token;
    this.selectedMarket = this.markets[2];


    const result = await chain('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params["quote"].toUpperCase()
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
          last_price_base: true,
          volume_24_base: true,
          date_created: true,
        }
      ]
    });

    this.token = result.token[0];

    const listingsResult = await chain('query')({
      marketplace_cft20_detail: [
        {
          where: {
            token_id: {
              _eq: this.token.id
            },
            marketplace_listing: {
              is_cancelled: {
                _eq: false
              },
              is_filled: {
                _eq: false
              }
            }
          }
        },
        {
          id: true,
          marketplace_listing: {
            seller_address: true,
            total: true,
            depositor_address: true,
            is_deposited: true,
            transaction: {
              hash: true
            },
          },
          ppt: true,
          amount: true,
        }
      ]
    });
    this.listings = listingsResult.marketplace_cft20_detail;

    const wsChain = Subscription(environment.api.wss);
    wsChain('subscription')({
      status: [
        {
          where: {
            chain_id: {
              _eq: environment.chain.chainId
            }
          }
        },
        {
          base_token: true,
          base_token_usd: true,
        }
      ]
    }).on(({ status }) => {
      this.baseTokenUSD = status[0].base_token_usd;
    });

    // wsChain('subscription')({
    //   token: [
    //     {
    //       where: {
    //         ticker: {
    //           _eq: this.activatedRoute.snapshot.params["quote"].toUpperCase()
    //         }
    //       }
    //     }, {
    //       id: true,
    //       name: true,
    //       ticker: true,
    //       decimals: true,
    //       content_path: true,
    //       last_price_base: true,
    //       volume_24_base: true,
    //     }
    //   ]
    // }).on(({ token }) => {
    //   this.token = token[0];
    // });

    // wsChain('subscription')({
    //   token_open_position: [
    //     {
    //       where: {
    //         _and: [
    //           {
    //             token: {
    //               ticker: {
    //                 _eq: this.activatedRoute.snapshot.params["quote"].toUpperCase()
    //               }
    //             }
    //           },
    //           {
    //             is_cancelled: {
    //               _eq: false
    //             }
    //           },
    //           {
    //             is_filled: {
    //               _eq: false
    //             }
    //           }
    //         ]
    //       }
    //     }, {
    //       id: true,
    //       token: {
    //         ticker: true,
    //       },
    //       seller_address: true,
    //       ppt: true,
    //       amount: true,
    //       total: true,
    //       is_cancelled: false,
    //       is_filled: false,
    //     }
    //   ]
    // }).on(({ token_open_position }) => {
    //   this.positions = token_open_position;
    // });

    this.isLoading = false;
  }

  async deposit(listingHash: string) {
    const chain = Chain(environment.api.endpoint)
    const listingResult = await chain('query')({
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: listingHash
              }
            }
          }
        }, {
          seller_address: true,
          total: true,
          deposit_total: true,
          is_deposited: true,
          is_cancelled: true,
          is_filled: true,
        }
      ]
    });

    if (listingResult.marketplace_listing.length == 0) {
      alert("Listing not found");
      return;
    }
    const listing = listingResult.marketplace_listing[0];

    const deposit: bigint = listing.deposit_total as bigint;
    console.log(deposit);

    const purchaseMessage = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: listing.seller_address,
        amount: [
          {
            denom: "uatom",
            amount: deposit.toString(),
          }
        ],
      }).finish(),
    }

    const purchaseMessageJSON = {
      '@type': "/cosmos.bank.v1beta1.MsgSend",
      from_address: (await this.walletService.getAccount()).address,
      to_address: listing.seller_address,
      amount: [
        {
          denom: "uatom",
          amount: deposit.toString(),
        }
      ],
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["h", listingHash],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'deposit', params);
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
        metaprotocol: 'marketplace',
        metaprotocolAction: 'deposit',
        messages: [purchaseMessage],
        messagesJSON: [purchaseMessageJSON],
      }
    });
    modal.present();
  }

  async buy(listingHash: string) {
    const chain = Chain(environment.api.endpoint)
    const listingResult = await chain('query')({
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: listingHash
              }
            }
          }
        }, {
          seller_address: true,
          total: true,
          deposit_total: true,
          is_deposited: true,
          is_cancelled: true,
          is_filled: true,
        }
      ]
    });

    if (listingResult.marketplace_listing.length == 0) {
      alert("Listing not found");
      return;
    }
    const listing = listingResult.marketplace_listing[0];

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

    let totaluatom: bigint = listing.total as bigint;
    const deposit: bigint = listing.deposit_total as bigint;
    // Subtract deposit amount already sent
    totaluatom -= deposit;

    const purchaseMessage = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.encode({
        fromAddress: (await this.walletService.getAccount()).address,
        toAddress: listing.seller_address,
        amount: [
          {
            denom: "uatom",
            amount: totaluatom.toString(),
          }
        ],
      }).finish(),
    }

    const purchaseMessageJSON = {
      '@type': "/cosmos.bank.v1beta1.MsgSend",
      from_address: (await this.walletService.getAccount()).address,
      to_address: listing.seller_address,
      amount: [
        {
          denom: "uatom",
          amount: totaluatom.toString(),
        }
      ],
    }

    // Calculate the trading fee
    let overrideFee = environment.fees.protocol.cft20.buy.amount;
    if (environment.fees.protocol.cft20.buy.type == 'dynamic-percent') {
      const feePercentage = parseFloat(environment.fees.protocol.cft20.buy.amount);
      const fee = parseInt(totaluatom.toString()) * feePercentage;
      overrideFee = fee.toString();
      console.log("overrideFee", overrideFee);
    }

    // Construct metaprotocol memo message
    const params = new Map([
      ["h", listingHash],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'buy.cft20', params);
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
        metaprotocol: 'marketplace',
        metaprotocolAction: 'buy.cft20',
        messages: [purchaseMessage],
        messagesJSON: [purchaseMessageJSON],
        overrideFee,
      }
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
    const params = new Map([
      ["h", listingHash],
    ]);
    const urn = this.protocolService.buildURN(environment.chain.chainId, 'delist', params);
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
        metaprotocol: 'marketplace',
        metaprotocolAction: 'delist',
      }
    });
    modal.present();

  }

  async listSale() {

    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: SellModalPage,

      componentProps: {
        ticker: this.token.ticker
      }
    });
    modal.present();
  }

}
