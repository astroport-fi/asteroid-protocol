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
import { GenericPreviewPage } from '../generic-preview/generic-preview.page';
import { DropdownModule } from 'primeng/dropdown';
import { ViewInscriptionPage } from '../view-inscription/view-inscription.page';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';

@Component({
  selector: 'app-markets-inscription',
  templateUrl: './markets-inscription.page.html',
  styleUrls: ['./markets-inscription.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, TableModule, GenericPreviewPage, DropdownModule, ShortenAddressPipe]
})
export class MarketsInscriptionPage implements OnInit {

  isLoading = true;
  isTableLoading: boolean = false;
  userAddress: string = '';
  inscriptions: any = null;
  offset = 0;
  limit = 20;
  total: number = 20000;
  lastFetchCount = 0;
  baseToken: any;
  chain: any;

  priceRanges: string[] = ["0-10 ATOM", "10+ ATOM"];
  selectedPriceRange: string | undefined;

  blockRanges: string[] = ["Sub 100", "Sub 1 000", "Sub 10 000", "Sub 100 000"];
  selectedBlockRange: string | undefined;

  orderOptions: string[] = ["Newest", "Oldest"];
  selectedOrder: string | undefined;

  typeOptions: string[] = ["Image", "Video"];
  selectedType: string | undefined;

  constructor(private activatedRoute: ActivatedRoute, private priceService: PriceService, private modalCtrl: ModalController, private walletService: WalletService) {
    // this.lastFetchCount = this.limit;
    this.chain = Chain(environment.api.endpoint);
  }

  async ngOnInit() {

    const result = await this.fetchInscriptions()
    this.inscriptions = result.inscription;
    this.isLoading = false;


  }

  async fetchInscriptions() {

    return this.chain('query')({
      inscription: [
        {
          offset: 0,
          limit: 50,
          order_by: [
            {
              id: order_by.asc
            }
          ],
        }, {
          id: true,
          transaction: {
            hash: true
          },
          // transaction_hash: true,
          current_owner: true,
          content_path: true,
          content_size_bytes: true,
          date_created: true,
          is_explicit: true,
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
        }
      ]
    });
  }

  // async listSale(event: any, ticker: string) {
  //   event.stopPropagation();
  //   const modal = await this.modalCtrl.create({
  //     keyboardClose: true,
  //     backdropDismiss: true,
  //     component: SellModalPage,

  //     componentProps: {
  //       ticker: ticker
  //     }
  //   });
  //   modal.present();
  // }

  // customSort(event: SortEvent) {
  //   if (event.field == 'listings') {
  //     event.data?.sort((data1, data2) => {
  //       let value1 = data1["marketplace_cft20_details"].length;
  //       let value2 = data2["marketplace_cft20_details"].length;
  //       let result = null;

  //       if (value1 == null && value2 != null) result = -1;
  //       else if (value1 != null && value2 == null) result = 1;
  //       else if (value1 == null && value2 == null) result = 0;
  //       else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
  //       else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

  //       return event.order as number * result;
  //     });

  //   }

  //   event.data?.sort((data1, data2) => {
  //     let value1 = data1[event.field as string];
  //     let value2 = data2[event.field as string];
  //     let result = null;

  //     if (value1 == null && value2 != null) result = -1;
  //     else if (value1 != null && value2 == null) result = 1;
  //     else if (value1 == null && value2 == null) result = 0;
  //     else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
  //     else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

  //     return event.order as number * result;
  //   });
  // }

  // async load(event: TableLazyLoadEvent) {
  //   this.isTableLoading = true;

  //   // Determine the sort order
  //   let sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

  //   // Build the order_by clause based on the event.sortField and sortOrder
  //   let orderByClause: any = {};
  //   if (event.sortField) {
  //     orderByClause[event.sortField as string] = sortOrder;
  //   } else {
  //     // Default sorting, if no sortField is provided
  //     orderByClause = { id: 'asc' };
  //   }

  //   let whereClause: any = {};
  //   if (event.globalFilter) {
  //     const globalFilter = event.globalFilter as string;
  //     whereClause = {
  //       _or: [
  //         { name: { _like: `%${globalFilter}%` } },
  //         { name: { _like: `%${globalFilter.toUpperCase()}%` } },
  //         { ticker: { _like: `%${globalFilter}%` } },
  //         { ticker: { _like: `%${globalFilter.toUpperCase()}%` } },
  //       ]
  //     };
  //   }


  //   const tokensResult = await this.chain('query')({
  //     token: [
  //       {
  //         offset: event.first,
  //         limit: event.rows,
  //         order_by: [
  //           orderByClause
  //         ],
  //         where: whereClause
  //       }, {
  //         id: true,
  //         transaction: {
  //           hash: true
  //         },
  //         marketplace_cft20_details: [
  //           {
  //             where: {
  //               marketplace_listing: {
  //                 is_cancelled: {
  //                   _eq: false
  //                 },
  //                 is_filled: {
  //                   _eq: false
  //                 }
  //               }
  //             }
  //           },
  //           {
  //             id: true,
  //           }
  //         ],
  //         token_holders: [
  //           {
  //             where: {
  //               address: {
  //                 _eq: this.userAddress
  //               }
  //             }
  //           },
  //           {
  //             amount: true
  //           }
  //         ],
  //         content_path: true,
  //         name: true,
  //         ticker: true,
  //         decimals: true,
  //         last_price_base: true,
  //         volume_24_base: true,
  //       }
  //     ]
  //   });
  //   this.tokens = tokensResult.token;
  //   this.isTableLoading = false;
  // }



}
