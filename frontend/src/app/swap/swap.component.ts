import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, SegmentCustomEvent } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import {
  AsteroidService,
  Status,
  Token,
} from '../core/service/asteroid.service';
import { SwapBuyPage } from '../swap-buy/swap-buy.component';
import { SwapSellPage } from '../swap-sell/swap-sell.component';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrl: './swap.component.scss',
  standalone: true,
  imports: [IonicModule, SwapSellPage, SwapBuyPage],
})
export class SwapPage implements OnInit {
  kind = 'buy';
  ticker: string = environment.swap.defaultToken;
  token: Token | undefined;
  status: Status | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private asteroidService: AsteroidService,
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
  }

  sectionChanged(event: SegmentCustomEvent) {
    this.kind = event.target.value as string;
  }
}
