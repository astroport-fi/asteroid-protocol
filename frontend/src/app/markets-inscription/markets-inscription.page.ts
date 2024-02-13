import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollCustomEvent, ModalController, IonicModule } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PriceService } from '../core/service/price.service';
import { WalletService } from '../core/service/wallet.service';
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { DropdownModule } from 'primeng/dropdown';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { ViewInscriptionModalPage } from '../view-inscription-modal/view-inscription-modal.page';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgScrollbarReachedModule } from 'ngx-scrollbar/reached-event';

@Component({
  selector: 'app-markets-inscription',
  templateUrl: './markets-inscription.page.html',
  styleUrls: ['./markets-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, GenericPreviewPage, DropdownModule, ShortenAddressPipe, NgScrollbarModule, NgScrollbarReachedModule]
})
export class MarketsInscriptionPage implements OnInit {

  isLoading = true;
  isTableLoading: boolean = false;
  walletAddress: string = '';
  marketplaceDetail: any = null;
  reservedMarketplaceDetail: any = null;
  offset = 0;
  limit = 25;
  total: number = 20000;
  lastFetchCount = 0;
  baseToken: any;
  chain: any;
  currentFilter: any = {};

  selectedPriceRange: string | undefined;
  selectedBlockRange: string | undefined;
  selectedOrder: any;
  selectedType: string | undefined;

  currentBlock: number = 0;
  baseTokenUSD: number = 0;

  volumeAtom: number = 0;
  volumeUSD: number = 0;

  constructor(private activatedRoute: ActivatedRoute, private priceService: PriceService, private modalCtrl: ModalController, private walletService: WalletService) {
    this.lastFetchCount = this.limit;
    this.chain = Chain(environment.api.endpoint);

  }

  async ngOnInit() {

    const walletConnected = await this.walletService.isConnected();
    if (walletConnected) {
      this.walletAddress = (await this.walletService.getAccount()).address;
    }

    const statusResult = await this.chain('query')({
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
          last_processed_height: true,
        }
      ]
    })
    this.baseTokenUSD = statusResult.status[0].base_token_usd;
    this.currentBlock = statusResult.status[0].last_processed_height;


    this.selectedOrder = {
      marketplace_listing: {
        id: order_by.desc
      }
    };
    this.currentFilter = {};
    const result = await this.fetchInscriptions(
      this.currentFilter,
      [
        this.selectedOrder
      ]);
    this.marketplaceDetail = result.marketplace_inscription_detail;
    const reservedResult = await this.fetchReservedInscriptions();
    this.reservedMarketplaceDetail = reservedResult.marketplace_inscription_detail;

    const date24HoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();

    const tradeStatsResult = await this.chain('query')({
      inscription_trade_history_aggregate: [
        {
          where: {
            date_created: {
              _gte: date24HoursAgo
            }
          },
        },
        {
          aggregate: {
            sum: {
              amount_quote: true,
              total_usd: true
            }
          }
        }
      ]

    });
    this.volumeAtom = tradeStatsResult.inscription_trade_history_aggregate.aggregate.sum.amount_quote;
    this.volumeUSD = tradeStatsResult.inscription_trade_history_aggregate.aggregate.sum.total_usd;
    this.isLoading = false;


  }

  async fetchInscriptions(where: {}, order: any[]) {
    const fullWhere = {
      marketplace_listing: {
        is_cancelled: {
          _eq: false
        },
        is_filled: {
          _eq: false
        },
      },
      _and: where,
    };

    return this.chain('query')({
      marketplace_inscription_detail: [
        {
          where: fullWhere,
          offset: this.offset,
          limit: this.limit,
          order_by: order

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
              hash: true
            },
          },
          inscription: {
            id: true,
            transaction: {
              hash: true
            },
            content_path: true,
            __alias: {
              name: {
                metadata: [{
                  path: '$.metadata.name'
                },
                  true
                ]
              },
              description: {
                metadata: [{
                  path: '$.metadata.description'
                },
                  true
                ]
              },
              mime: {
                metadata: [{
                  path: '$.metadata.mime'
                },
                  true
                ]
              }
            }
          },
          date_created: true,
        }
      ]

    });
  }

  async fetchReservedInscriptions() {

    return this.chain('query')({
      marketplace_inscription_detail: [
        {
          where: {
            marketplace_listing: {
              is_cancelled: {
                _eq: false
              },
              is_filled: {
                _eq: false
              },
              is_deposited: {
                _eq: true
              },
              depositor_address: {
                _eq: this.walletAddress
              },
              depositor_timedout_block: {
                _gt: this.currentBlock
              }
            }
          },
          limit: this.limit,
          order_by: [
            {
              id: order_by.asc
            }
          ]
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
              hash: true
            },
          },
          inscription: {
            id: true,
            transaction: {
              hash: true
            },
            content_path: true,
            __alias: {
              name: {
                metadata: [{
                  path: '$.metadata.name'
                },
                  true
                ]
              },
              description: {
                metadata: [{
                  path: '$.metadata.description'
                },
                  true
                ]
              },
              mime: {
                metadata: [{
                  path: '$.metadata.mime'
                },
                  true
                ]
              }
            }
          },
          date_created: true,
        }
      ]
    });
  }

  // This event is supposed to be of type SelectChangeEventDetail
  async selectionChange(type: string, event: any) {
    this.offset = 0;
    switch (type) {
      case "order":
        if (event.detail.value === "price-high") {
          this.selectedOrder = {
            marketplace_listing: {
              total: order_by.desc
            }
          }
        } else if (event.detail.value === "price-low") {
          this.selectedOrder = {
            marketplace_listing: {
              total: order_by.asc
            }
          }
        } else if (event.detail.value === "recent-adds") {
          this.selectedOrder = {
            marketplace_listing: {
              id: order_by.desc
            }
          }
        } else if (event.detail.value === "id-low") {
          this.selectedOrder = {
            inscription: {
              id: order_by.asc
            }
          }
        } else if (event.detail.value === "id-high") {
          this.selectedOrder = {
            inscription: {
              id: order_by.desc
            }
          }
        }
        break;
      case "price":
        if (event.detail.value === "all") {
          this.currentFilter = {};
        } else {
          const range = event.detail.value.split("-");
          if (range.length === 2) {
            const min = parseInt(range[0]);
            const max = parseInt(range[1]);
            this.currentFilter = {
              ...this.currentFilter,

              marketplace_listing: {
                total: {
                  _gte: min,
                  _lte: max
                }
              }

            };
          }
        }
        break;
      case "range":
        if (event.detail.value === "all") {
          this.currentFilter = {};
        } else {
          const maxID = parseInt(event.detail.value);
          this.currentFilter = {
            ...this.currentFilter,

            inscription: {
              id: {
                _lte: maxID
              }
            }

          };
        }
        break;
    }

    this.isLoading = true;
    const result = await this.fetchInscriptions(
      this.currentFilter,
      [
        this.selectedOrder
      ]);
    this.marketplaceDetail = result.marketplace_inscription_detail;
    this.isLoading = false;
  }

  async search(event: any) {
    if (event.target.value.length == 0) {
      this.isLoading = true;
      const result = await this.fetchInscriptions(
        {},
        [
          this.selectedOrder
        ]);
      this.marketplaceDetail = result.marketplace_inscription_detail;
      this.isLoading = false;
      return;
    }


    this.isLoading = true;
    this.offset = 0;
    this.limit = 50;
    // FE IDs are 0-indexed, so we need to add 1 to the ID
    const byID = isNaN(+event.target.value) ? 0 : +event.target.value + 1;

    const searchResult = await this.chain('query')({
      find_inscription_by_name: [
        {
          args: {
            query_name: "%" + event.target.value + "%"
          }
        },
        {
          id: true,
        }
      ]
    });

    // Since we don't have a direct way to do this LIKE query, we need to collect
    // IDs first, then fetch the actual information
    const result = await this.fetchInscriptions({
      inscription: {
        _or: [
          {
            id: {
              _in: searchResult.find_inscription_by_name.map((i: any) => i.id)
            }
          },
          {
            id: {
              _eq: byID
            }
          }
        ]

      }
    }, [this.selectedOrder]);

    this.marketplaceDetail = result.marketplace_inscription_detail;
    this.isLoading = false;
  }

  async buy(listingHash: string, inscriptionHash: string) {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      cssClass: 'large-modal',
      component: ViewInscriptionModalPage,
      componentProps: {
        hash: inscriptionHash,
        listingHash: listingHash
      }
    });
    modal.present();

  }

  async onIonInfinite(event: any) {
    if (this.lastFetchCount < this.limit) {
      (event as InfiniteScrollCustomEvent).target.disabled = true;
      await (event as InfiniteScrollCustomEvent).target.complete();
      return;
    }

    this.offset += this.limit;
    const result = await this.fetchInscriptions(this.currentFilter, [this.selectedOrder]);
    this.marketplaceDetail = [...this.marketplaceDetail, ...result.marketplace_inscription_detail];

    this.lastFetchCount = result.marketplace_inscription_detail.length;
    await (event as InfiniteScrollCustomEvent).target.complete();
  }

}
