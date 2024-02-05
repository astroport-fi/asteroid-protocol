import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MaskitoModule } from '@maskito/angular';
import {
  IonInput,
  IonicModule,
  ModalController,
  SegmentCustomEvent,
} from '@ionic/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/helpers/zeus';
import { WalletService } from '../core/service/wallet.service';
import { MarketplaceService } from '../core/metaprotocol/marketplace.service';
import {
  GraphQLTypes,
  InputType,
  Selector,
  ValueTypes,
  order_by,
} from '../core/types/zeus';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { PercentageChangeComponent } from '../percentage-change/percentage-change.component';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';
import { BuyWizardModalPage } from '../buy-wizard-modal/buy-wizard-modal.page';

type ScalarDefinition = {
  smallint: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => number;
  };
  bigint: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => number;
  };
  numeric: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => number;
  };
  timestamp: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => string;
  };
  json: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => string;
  };
};

const tokenSelector = Selector('token')({
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
});

type Token = InputType<
  GraphQLTypes['token'],
  typeof tokenSelector,
  ScalarDefinition
>;

const statusSelector = Selector('status')({
  base_token: true,
  base_token_usd: true,
  last_processed_height: true,
});

type Status = InputType<
  GraphQLTypes['status'],
  typeof statusSelector,
  ScalarDefinition
>;

const cft20ListingSelector = Selector('marketplace_cft20_detail')({
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
});

type CFT20MarketplaceListing = InputType<
  GraphQLTypes['marketplace_cft20_detail'],
  typeof cft20ListingSelector,
  ScalarDefinition
>;

type ListingWithUSD = CFT20MarketplaceListing & {
  totalUSD: number;
  totalAtom: number;
};

enum FilterType {
  Usd,
  Atom,
  Token,
}

function getKey(filterType: FilterType) {
  if (filterType === FilterType.Token) {
    return 'amount';
  } else if (filterType === FilterType.Atom) {
    return 'totalAtom';
  } else {
    return 'totalUSD';
  }
}

function sortListings(listings: ListingWithUSD[], sortType: FilterType) {
  const key = getKey(sortType);
  return listings.sort((a, b) => a[key] - b[key]);
}

function findNearest(
  listings: ListingWithUSD[],
  amount: number,
  filterType: FilterType
) {
  const key = getKey(filterType);

  const sortedByDistance = [...listings].sort(
    (a, b) =>
      Math.abs(a[key] - amount * 10e5) - Math.abs(b[key] - amount * 10e5)
  );

  return sortedByDistance.slice(0, 3);
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.page.html',
  styleUrls: ['./swap.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    MaskitoModule,
    TokenDecimalsPipe,
    PercentageChangeComponent,
  ],
})
export class SwapPage implements OnInit {
  chain;
  token: Token | undefined;
  listings!: ListingWithUSD[];
  filteredListings!: ListingWithUSD[];
  baseTokenUSD = 0.0;
  floorPrice = 0;
  currentBlock = 0;
  limit = 2000;
  amount: number | null = null;
  filterType = FilterType.Usd;
  searchIn = '$';
  selected: ListingWithUSD | null = null;
  @ViewChild('input') input!: IonInput;

  swapForm: FormGroup = this.formBuilder.group({
    baseToken: [''],
  });

  readonly decimalMask: MaskitoOptions;
  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) =>
    (el as HTMLIonInputElement).getInputElement();

  constructor(
    private activatedRoute: ActivatedRoute,
    private walletService: WalletService,
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController
  ) {
    this.chain = Chain(environment.api.endpoint);
    this.decimalMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 6,
      min: 0,
    });
  }

  async ngOnInit() {
    this.token = await this.getToken();
    if (!this.token) {
      console.warn('Unknown token');
      // @todo show some kind of error
      return;
    }

    const status = await this.getStatus();
    if (!status) {
      console.warn('No status');
      // @todo show some kind of error
      return;
    }

    this.baseTokenUSD = status.base_token_usd;
    this.currentBlock = status.last_processed_height;

    const listings = await this.getListings(this.token.id, this.limit);
    this.listings = sortListings(listings.map(this.mapListing), FilterType.Usd);
    this.filteredListings = this.listings.slice(0, 3);

    const goal = 120 * 10e5;
    const closest = this.listings.reduce(function (prev, curr) {
      return Math.abs(curr.totalUSD - goal) < Math.abs(prev.totalUSD - goal)
        ? curr
        : prev;
    });
    this.listings.indexOf(closest);

    // @todo handle zero listings

    this.floorPrice = await this.getFloorPrice(this.token.id);

    this.swapForm.controls['baseToken'].valueChanges.subscribe((change) => {
      if (change) {
        this.amount = parseFloat(change.replace(' ', ''));
      } else {
        this.amount = null;
      }
      this.filterListings();
    });
  }

  ionViewDidEnter() {
    this.input.setFocus();
  }

  sectionChanged(event: SegmentCustomEvent) {
    this.searchIn = (event.detail.value as string) ?? '$';
    let filterType = FilterType.Token;
    if (this.searchIn === '$') {
      filterType = FilterType.Usd;
    } else if (this.searchIn === 'ATOM') {
      filterType = FilterType.Atom;
    }
    this.filterType = filterType;
    this.listings = sortListings(this.listings, filterType);
    this.filterListings();
    this.input.setFocus();
  }

  onSelect(listing: ListingWithUSD) {
    this.selected = listing;
  }

  async buy() {
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
        hash: this.selected?.marketplace_listing.transaction.hash,
        metaprotocol: 'marketplace',
        metaprotocolAction: 'deposit',
      },
    });
    modal.present();
  }

  filterListings() {
    if (this.amount) {
      this.filteredListings = findNearest(
        this.listings,
        this.amount,
        this.filterType
      );
    } else {
      this.filteredListings = this.listings.slice(0, 3);
    }
  }

  private async getToken(): Promise<Token | undefined> {
    const ticker = this.activatedRoute.snapshot.params['quote'].toUpperCase();
    const result = await this.chain<'query', ScalarDefinition>('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: ticker,
            },
          },
        },
        tokenSelector,
      ],
    });
    return result.token[0];
  }

  private async getStatus(): Promise<Status | undefined> {
    const statusResult = await this.chain<'query', ScalarDefinition>('query')({
      status: [
        {
          where: {
            chain_id: {
              _eq: environment.chain.chainId,
            },
          },
        },
        statusSelector,
      ],
    });

    return statusResult.status[0];
  }

  query() {
    return this.chain<'query', ScalarDefinition>('query');
  }

  private async getListings(
    tokenId: number,
    limit: number,
    orderBy?: ValueTypes['marketplace_cft20_detail_order_by']
  ): Promise<CFT20MarketplaceListing[]> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.asc,
      };
    }

    const listingsResult = await this.chain<'query', ScalarDefinition>('query')(
      {
        marketplace_cft20_detail: [
          {
            where: {
              token_id: {
                _eq: tokenId,
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
            limit: limit,
            order_by: [orderBy],
          },
          cft20ListingSelector,
        ],
      }
    );
    return listingsResult.marketplace_cft20_detail;
  }

  private mapListing = (listing: CFT20MarketplaceListing): ListingWithUSD => {
    return {
      ...listing,
      totalUSD: listing.marketplace_listing.total * this.baseTokenUSD,
      totalAtom: listing.marketplace_listing.total,
    };
  };

  private async getFloorPrice(tokenId: number) {
    const floorListings = await this.getListings(tokenId, 1, {
      ppt: order_by.asc,
    });
    return floorListings[0].ppt;
  }
}
