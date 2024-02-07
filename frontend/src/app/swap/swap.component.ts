import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaskitoModule } from '@maskito/angular';
import { IonInput, IonicModule, ModalController } from '@ionic/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { environment } from 'src/environments/environment';
import { WalletService } from '../core/service/wallet.service';
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
import { TokenModalComponent } from '../token-modal/token-modal.component';
import {
  AsteroidService,
  ScalarDefinition,
} from '../core/service/asteroid.service';

type BaseTokenType = 'atom' | 'usd';

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

const ATOM_DECIMALS = 1e6;

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

const RESULT_COUNT = 3;

function findNearest(
  listings: ListingWithUSD[],
  amount: number,
  maxRate: number,
  filterType: FilterType,
) {
  const key = getKey(filterType);

  const filteredListings = listings.filter((listing) => listing.ppt <= maxRate);
  const ppt = filteredListings.reduce((acc, listing) => {
    let amount = acc.get(listing.ppt);
    if (amount) {
      amount += listing.amount;
    } else {
      amount = listing.amount;
    }

    acc.set(listing.ppt, amount);
    return acc;
  }, new Map());
  const sortedByDistance = filteredListings.sort(
    (a, b) =>
      Math.abs(a[key] - amount) - Math.abs(b[key] - amount) ||
      a['ppt'] - b['ppt'],
  );

  return sortedByDistance.slice(0, RESULT_COUNT);
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrl: './swap.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    MaskitoModule,
    TokenDecimalsPipe,
    PercentageChangeComponent,
    TokenModalComponent,
  ],
})
export class SwapPage implements OnInit {
  isLoading = true;
  ticker: string = environment.swap.defaultToken;
  token: Token | undefined;
  listings!: ListingWithUSD[];
  filteredListings!: ListingWithUSD[];
  baseTokenUSD = 0.0;
  floorPrice = 0;
  currentBlock = 0;
  limit = 2000;
  baseAmount: number = 0;
  tokenAmount: number = 0;
  amount: number | null = null;
  maxRate: number = 0;
  baseToken: BaseTokenType = 'atom';
  filterType = FilterType.Atom;
  FilterType = FilterType;
  selected: ListingWithUSD | null = null;
  @ViewChild('input') input!: IonInput;

  swapForm: FormGroup = this.formBuilder.group({
    amount: [''],
    tokenAmount: [''],
    rate: [''],
  });

  readonly decimalMask: MaskitoOptions;
  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) =>
    (el as HTMLIonInputElement).getInputElement();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private walletService: WalletService,
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private asteroidService: AsteroidService,
  ) {
    this.decimalMask = maskitoNumberOptionsGenerator({
      decimalSeparator: '.',
      thousandSeparator: ' ',
      precision: 6,
      min: 0,
    });
  }

  async ngOnInit() {
    const quote = this.activatedRoute.snapshot.params['quote'];
    if (quote) {
      this.ticker = quote.toUpperCase();
    }

    this.token = await this.getToken(this.ticker);
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

    this.resetMaxRate();

    this.baseTokenUSD = status.base_token_usd;
    this.currentBlock = status.last_processed_height;

    const listings = await this.getListings(this.token.id, this.limit);
    this.listings = sortListings(listings.map(this.mapListing), FilterType.Usd);
    // this.filteredListings = this.listings.slice(0, RESULT_COUNT);

    // @todo handle zero listings

    this.floorPrice = await this.getFloorPrice(this.token.id);

    this.swapForm.controls['amount'].valueChanges.subscribe((change) => {
      if (change) {
        this.amount = parseFloat(change.replace(/ /g, '')) * ATOM_DECIMALS;
        this.baseAmount = this.amount;
        this.updateTokenAmount();
      } else {
        this.amount = null;
      }

      this.setBaseTokenFilterType();
      this.filterListings();
    });

    this.swapForm.controls['tokenAmount'].valueChanges.subscribe((change) => {
      if (change) {
        const amount = parseFloat(change.replace(/ /g, ''));
        this.amount = amount * Math.pow(10, this.token!.decimals);

        this.updateBaseAmount(amount);
      } else {
        this.amount = null;
      }
      this.filterType = FilterType.Token;
      this.filterListings();
    });

    this.swapForm.controls['rate'].valueChanges.subscribe((change) => {
      if (change) {
        this.maxRate = parseFloat(change.replace(/ /g, '')) * ATOM_DECIMALS;
      } else {
        this.resetMaxRate();
      }
      this.filterListings();
    });

    this.isLoading = false;
  }

  getRate() {
    let rate = this.maxRate;
    if (this.baseToken === 'usd') {
      rate *= this.baseTokenUSD;
    }
    return rate;
  }

  updateBaseAmount(amount: number) {
    let rate = this.getRate();

    this.baseAmount = amount * rate;
    this.swapForm.controls['amount'].setValue(
      Math.round(this.baseAmount) / ATOM_DECIMALS,
      { emitEvent: false },
    );
  }

  updateTokenAmount() {
    if (!this.amount) {
      return;
    }

    const rate = this.getRate();
    this.tokenAmount = this.amount / rate;
    this.swapForm.controls['tokenAmount'].setValue(
      Math.round(this.tokenAmount * ATOM_DECIMALS) / ATOM_DECIMALS,
      { emitEvent: false },
    );
  }

  resetMaxRate() {
    this.maxRate = this.token!.last_price_base;
    this.swapForm.controls['rate'].setValue(this.maxRate / ATOM_DECIMALS, {
      emitEvent: false,
    });
  }

  setBaseTokenFilterType() {
    let filterType: FilterType;
    if (this.baseToken === 'usd') {
      filterType = FilterType.Usd;
    } else {
      filterType = FilterType.Atom;
    }
    this.filterType = filterType;
  }

  baseTokenChange(baseToken: BaseTokenType) {
    this.baseToken = baseToken;
    this.setBaseTokenFilterType();
    this.updateTokenAmount();
    this.listings = sortListings(this.listings, this.filterType);
    this.filterListings();
    this.input.setFocus();
  }

  onSelect(listing: ListingWithUSD) {
    this.selected = listing;
  }

  async openTokenModal() {
    const emitter = new EventEmitter();
    const modal = await this.modalCtrl.create({
      component: TokenModalComponent,
      componentProps: {
        selectionChange: emitter,
      },
    });
    emitter.subscribe((token) => {
      this.modalCtrl.dismiss();
      this.router.navigate(['/app/swap', token.ticker]);
    });
    await modal.present();
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
    this.selected = null;
    if (this.amount) {
      this.filteredListings = findNearest(
        this.listings,
        this.amount,
        this.maxRate,
        this.filterType,
      );
    } else {
      this.filteredListings = this.listings.slice(0, RESULT_COUNT);
    }
  }

  private async getToken(ticker: string): Promise<Token | undefined> {
    const result = await this.asteroidService.query({
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
    const statusResult = await this.asteroidService.query({
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

  private async getListings(
    tokenId: number,
    limit: number,
    orderBy?: ValueTypes['marketplace_cft20_detail_order_by'],
  ): Promise<CFT20MarketplaceListing[]> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.asc,
      };
    }

    const listingsResult = await this.asteroidService.query({
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
    });
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
    const listing = floorListings[0];
    if (!listing) {
      return 0;
    }
    return listing.ppt;
  }
}
