import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { Chain, Subscription, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PriceService } from '../core/service/price.service';
import { SortEvent } from 'primeng/api';
import { SellModalPage } from '../sell-modal/sell-modal.page';
import { WalletService } from '../core/service/wallet.service';
import { MarketplaceNoticeModalPage } from '../marketplace-notice/marketplace-notice-modal.page';

@Component({
  selector: 'app-markets',
  templateUrl: './markets.page.html',
  styleUrls: ['./markets.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, TableModule]
})
export class MarketsPage implements OnInit {

  isLoading = true;
  isTableLoading: boolean = false;
  userAddress: string = '';
  tokens: any = null;
  offset = 0;
  limit = 20;
  total: number = 20000;
  lastFetchCount = 0;
  baseToken: any;
  chain: any;

  constructor(private activatedRoute: ActivatedRoute, private priceService: PriceService, private modalCtrl: ModalController, private walletService: WalletService) {
    this.lastFetchCount = this.limit;
    this.chain = Chain(environment.api.endpoint);
  }

  async ngOnInit() {

    // Check if tis use has seen the notice
    // if (localStorage.getItem('marketplace-notice') != 'shown') {
    this.modalCtrl.create({
      component: MarketplaceNoticeModalPage,
    }).then(modal => {
      modal.present();
    });
    // }

    this.activatedRoute.params.subscribe(async params => {
      if (await this.walletService.isConnected()) {
        this.userAddress = (await this.walletService.getAccount()).address;
      }

      this.isLoading = true;


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
          }
        ]
      });
      this.baseToken = statusResult.status[0];

      const tokensResult = await this.chain('query')({
        token: [
          {
            order_by: [
              { id: order_by.desc }
            ],
            limit: 1
          }, {
            id: true,
          }
        ]
      });
      this.total = tokensResult.token[0].id;


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
        this.baseToken = status[0];
      });

      this.isLoading = false;
    });
  }

  async listSale(event: any, ticker: string) {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: SellModalPage,

      componentProps: {
        ticker: ticker
      }
    });
    modal.present();
  }

  customSort(event: SortEvent) {
    if (event.field == 'listings') {
      event.data?.sort((data1, data2) => {
        let value1 = data1["marketplace_cft20_details"].length;
        let value2 = data2["marketplace_cft20_details"].length;
        let result = null;

        if (value1 == null && value2 != null) result = -1;
        else if (value1 != null && value2 == null) result = 1;
        else if (value1 == null && value2 == null) result = 0;
        else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
        else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

        return event.order as number * result;
      });

    }

    event.data?.sort((data1, data2) => {
      let value1 = data1[event.field as string];
      let value2 = data2[event.field as string];
      let result = null;

      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
      else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

      return event.order as number * result;
    });
  }

  async load(event: TableLazyLoadEvent) {
    this.isTableLoading = true;

    // Determine the sort order
    let sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Build the order_by clause based on the event.sortField and sortOrder
    let orderByClause: any = {};
    if (event.sortField) {
      orderByClause[event.sortField as string] = sortOrder;
    } else {
      // Default sorting, if no sortField is provided
      orderByClause = { id: 'asc' };
    }

    let whereClause: any = {};
    if (event.globalFilter) {
      const globalFilter = event.globalFilter as string;
      whereClause = {
        _or: [
          { name: { _like: `%${globalFilter}%` } },
          { name: { _like: `%${globalFilter.toUpperCase()}%` } },
          { ticker: { _like: `%${globalFilter}%` } },
          { ticker: { _like: `%${globalFilter.toUpperCase()}%` } },
        ]
      };
    }


    const tokensResult = await this.chain('query')({
      token: [
        {
          offset: event.first,
          limit: event.rows,
          order_by: [
            orderByClause
          ],
          where: whereClause
        }, {
          id: true,
          transaction: {
            hash: true
          },
          marketplace_cft20_details: [
            {
              where: {
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
            }
          ],
          token_holders: [
            {
              where: {
                address: {
                  _eq: this.userAddress
                }
              }
            },
            {
              amount: true
            }
          ],
          content_path: true,
          name: true,
          ticker: true,
          decimals: true,
          last_price_base: true,
          volume_24_base: true,
        }
      ]
    });
    this.tokens = tokensResult.token;
    this.isTableLoading = false;
  }


}
