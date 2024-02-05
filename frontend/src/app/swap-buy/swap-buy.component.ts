import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonInput, IonicModule } from '@ionic/angular';
import { MaskitoModule } from '@maskito/angular';
import { MaskitoElementPredicateAsync, MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { ATOM_DECIMALS } from 'src/constants';
import { environment } from 'src/environments/environment';
import { BuyWizardModalPage } from '../buy-wizard-modal/buy-wizard-modal.page';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  CFT20MarketplaceListing,
  Token,
} from '../core/service/asteroid.service';
import { TokenModalComponent } from '../token-modal/token-modal.component';

type BaseTokenType = 'atom' | 'usd';

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
    TokenModalComponent,
  ],
})
export class SwapBuyPage implements OnInit {
  @Input({ required: true }) token!: Token;
  @Input({ required: true }) baseTokenUSD!: number;
  @Output() filterChange = new EventEmitter<CFT20MarketplaceListing[]>();

  isLoading = true;
  ticker: string = environment.swap.defaultToken;
  listings!: ListingWithUSD[];
  limit = 2000;
  baseAmount: number = 0;
  tokenAmount: number = 0;
  amount: number | null = null;
  maxRate: number = 0;
  baseToken: BaseTokenType = 'atom';
  filterType = FilterType.Atom;
  FilterType = FilterType;
  @ViewChild('input') input!: IonInput;

  swapForm: FormGroup = this.formBuilder.group({
    baseAmount: [''],
    tokenAmount: [''],
    rate: [''],
  });

  readonly decimalMask: MaskitoOptions;
  readonly maskPredicate: MaskitoElementPredicateAsync = async (el) =>
    (el as HTMLIonInputElement).getInputElement();

  constructor(
    private formBuilder: FormBuilder,
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

    const listings = await this.asteroidService.getTokenListings(
      this.token.id,
      0,
      this.limit,
    );
    this.listings = sortListings(
      listings.listings.map(this.mapListing),
      FilterType.Atom,
    );

    this.swapForm.controls['baseAmount'].valueChanges.subscribe((change) => {
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

  filterListings() {
    if (!this.amount) {
      this.filterChange.emit();
      return;
    }

    const filteredListings = findNearest(
      this.listings,
      this.amount,
      this.maxRate,
      this.filterType,
    );
    this.filterChange.emit(filteredListings);
  }
  private mapListing = (listing: CFT20MarketplaceListing): ListingWithUSD => {
    return {
      ...listing,
      totalUSD: listing.marketplace_listing.total * this.baseTokenUSD,
      totalAtom: listing.marketplace_listing.total,
    };
  };
}
