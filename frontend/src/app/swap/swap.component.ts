import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonicModule,
  ModalController,
  SegmentCustomEvent,
} from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import {
  AsteroidService,
  CFT20MarketplaceListing,
  Status,
  Token,
} from '../core/service/asteroid.service';
import { SellModalPage } from '../sell-modal/sell-modal.page';
import { SwapBuyPage } from '../swap-buy/swap-buy.component';
import { SwapSellPage } from '../swap-sell/swap-sell.component';
import { TokenListingsComponent } from '../token-listings/token-listings.component';
import { TokenModalComponent } from '../token-modal/token-modal.component';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrl: './swap.component.scss',
  standalone: true,
  imports: [
    IonicModule,
    SwapSellPage,
    SwapBuyPage,
    TokenListingsComponent,
    TokenDecimalsPipe,
    DecimalPipe,
  ],
})
export class SwapPage implements OnInit {
  kind = 'buy';
  ticker: string = environment.swap.defaultToken;
  token: Token | undefined;
  status: Status | undefined;
  isLoading = true;
  filteredListings: CFT20MarketplaceListing[] | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private asteroidService: AsteroidService,
    private modalCtrl: ModalController,
    private router: Router,
  ) {}

  async ngOnInit() {
    const kind = this.activatedRoute.snapshot.params['kind'];
    if (kind == 'sell') {
      this.kind = kind;
    }

    const quote = this.activatedRoute.snapshot.params['quote'];
    if (quote) {
      this.ticker = quote.toUpperCase();
    }

    this.token = await this.asteroidService.getToken(this.ticker);
    if (!this.token) {
      console.warn('Unknown token');
      // @todo show some kind of error
      return;
    }

    this.status = await this.asteroidService.getStatus();
    if (!this.status) {
      console.warn('No status');
      // @todo show some kind of error
      return;
    }

    this.isLoading = false;
  }

  sectionChanged(event: SegmentCustomEvent) {
    this.kind = event.target.value as string;
  }

  filterChanged(listings: CFT20MarketplaceListing[]) {
    this.filteredListings = listings;
  }

  async listSale() {
    const modal = await this.modalCtrl.create({
      keyboardClose: true,
      backdropDismiss: true,
      component: SellModalPage,

      componentProps: {
        ticker: this.token!.ticker,
      },
    });
    modal.present();
  }

  async openTokenModal() {
    if (!this.status) {
      return;
    }

    const emitter = new EventEmitter<Token>();
    const modal = await this.modalCtrl.create({
      component: TokenModalComponent,
      componentProps: {
        baseTokenUSD: this.status?.base_token_usd,
        selectionChange: emitter,
      },
    });
    emitter.subscribe((token) => {
      this.modalCtrl.dismiss();
      this.router.navigate(['/app/swap', token.ticker]);
    });
    await modal.present();
  }
}
