import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { SortEvent } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { environment } from 'src/environments/environment';
import { BuyWizardModalPage } from '../buy-wizard-modal/buy-wizard-modal.page';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  CFT20MarketplaceListing,
  Status,
  Token,
} from '../core/service/asteroid.service';
import { WalletService } from '../core/service/wallet.service';
import { ValueTypes, order_by } from '../core/types/zeus';
import { TableRowDirective } from '../directives/table-row.directive';
import { TransactionFlowModalPage } from '../transaction-flow-modal/transaction-flow-modal.page';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

function sortKey(value1: number, value2: number, order: number) {
  let result: number;

  if (value1 == null && value2 != null) result = -1;
  else if (value1 != null && value2 == null) result = 1;
  else if (value1 == null && value2 == null) result = 0;
  else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

  return order * result;
}

@Component({
  selector: 'app-token-listings',
  templateUrl: './token-listings.component.html',
  styleUrl: './token-listings.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TokenDecimalsPipe,
    TableModule,
    DateAgoPipe,
    TableRowDirective,
  ],
})
export class TokenListingsComponent implements OnInit {
  @Input({ required: true }) token!: Token;
  @Input({ required: true }) status!: Status;
  @ViewChild('data') readonly dataTable!: Table;

  isLoading = true;
  isTableLoading: boolean = true;
  baseTokenUSD!: number;
  currentBlock = 0;
  walletAddress: string | undefined;
  listings!: CFT20MarketplaceListing[];
  _listingsFilter: CFT20MarketplaceListing[] | undefined;
  total: number = 0;

  constructor(
    private asteroidService: AsteroidService,
    private walletService: WalletService,
    private modalCtrl: ModalController,
    private protocolService: MarketplaceService,
  ) {}

  async ngOnInit() {
    this.walletAddress = await this.walletService.getAddress();
    this.baseTokenUSD = this.status.base_token_usd;
    this.currentBlock = this.status.last_processed_height;
    this.isLoading = false;
  }

  @Input() set listingsFilter(value: CFT20MarketplaceListing[] | undefined) {
    if (value) {
      this._listingsFilter = value;
      this.listings = value;
    } else if (this._listingsFilter) {
      this._listingsFilter = undefined;
      this.load(this.dataTable as TableLazyLoadEvent);
    }
  }

  customSort(
    tableSortOrder: number | null | undefined,
    sortField: string | string[] | null | undefined,
  ) {
    this.listings.sort((data1, data2) => {
      let value1: number;
      let value2: number;
      if (sortField === 'marketplace_listing.total') {
        value1 = data1['marketplace_listing'].total;
        value2 = data2['marketplace_listing'].total;
      } else if (sortField === 'marketplace_listing.deposit_total') {
        value1 =
          data1['marketplace_listing'].deposit_total /
          data1['marketplace_listing'].total;
        value2 =
          data2['marketplace_listing'].deposit_total /
          data2['marketplace_listing'].total;
      } else if (sortField === 'ppt') {
        value1 = data1.ppt;
        value2 = data2.ppt;
      } else if (sortField == 'date_created') {
        value1 = Date.parse(data1.date_created);
        value2 = Date.parse(data2.date_created);
      } else {
        value1 = data1.amount;
        value2 = data2.amount;
      }

      return sortKey(value1, value2, tableSortOrder ?? 1);
    });
  }

  getOrderBy(
    tableSortOrder: number | null | undefined,
    sortField: string | string[] | null | undefined,
  ) {
    let sortOrder = tableSortOrder === 1 ? order_by.asc : order_by.desc;

    // Build the order_by clause based on the event.sortField and sortOrder
    let orderByClause: ValueTypes['marketplace_cft20_detail_order_by'] = {};
    if (sortField) {
      if (sortField == 'marketplace_listing.total') {
        orderByClause = {
          marketplace_listing: {
            total: sortOrder,
          },
        };
      } else if (sortField == 'marketplace_listing.deposit_total') {
        orderByClause = {
          marketplace_listing: {
            deposit_total: sortOrder,
          },
        };
      } else {
        orderByClause[
          sortField as keyof ValueTypes['marketplace_cft20_detail_order_by']
        ] = sortOrder;
      }
    } else {
      // Default sorting, if no sortField is provided
      orderByClause = { ppt: order_by.asc };
    }
    return orderByClause;
  }

  async load(event: TableLazyLoadEvent) {
    if (this._listingsFilter) {
      this.customSort(event.sortOrder, event.sortField);
      return;
    }

    this.isTableLoading = true;

    const res = await this.asteroidService.getTokenListings(
      this.token.id,
      event.first,
      event.rows ?? 20,
      this.getOrderBy(event.sortOrder, event.sortField),
    );
    this.listings = res.listings;
    this.total = res.count;

    this.isTableLoading = false;
  }

  async deposit(hash: string) {
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

    this.modalCtrl.dismiss({
      dismissed: true,
    });

    const modal = await this.modalCtrl.create({
      component: BuyWizardModalPage,
      componentProps: {
        hash,
        metaprotocol: 'marketplace',
        metaprotocolAction: 'deposit',
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
}
