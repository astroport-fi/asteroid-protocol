import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonInput, IonicModule, ModalController } from '@ionic/angular';
import { MaskitoModule } from '@maskito/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { ATOM_DECIMALS } from 'src/constants';
import { environment } from 'src/environments/environment';
import { BuyWizardModalPage } from '../buy-wizard-modal/buy-wizard-modal.page';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  ScalarDefinition,
  Token,
} from '../core/service/asteroid.service';
import { WalletService } from '../core/service/wallet.service';
import {
  GraphQLTypes,
  InputType,
  Selector,
  ValueTypes,
  order_by,
} from '../core/types/zeus';
import { PercentageChangeComponent } from '../percentage-change/percentage-change.component';
import { TokenModalComponent } from '../token-modal/token-modal.component';
import { WalletRequiredModalPage } from '../wallet-required-modal/wallet-required-modal.page';

type BaseTokenType = 'atom' | 'usd';

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
  selector: 'app-swap-buy',
  templateUrl: './swap-buy.component.html',
  styleUrl: './swap-buy.component.scss',
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
export class SwapBuyPage implements OnInit {
  @Input({ required: true }) token!: Token;
  @Input({ required: true }) baseTokenUSD!: number;

  isLoading = true;
  ticker: string = environment.swap.defaultToken;
  listings!: ListingWithUSD[];
  filteredListings!: ListingWithUSD[];
  floorPrice = 0;
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
    this.resetMaxRate();

    const listings = await this.getListings(this.token.id, this.limit);
    this.listings = sortListings(listings.map(this.mapListing), FilterType.Usd);

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
        this.tokenAmount = amount;
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

  updateBaseAmount(tokenAmount: number) {
    let rate = this.getRate();

    this.baseAmount = tokenAmount * rate;
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
        baseTokenUSD: this.baseTokenUSD,
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
