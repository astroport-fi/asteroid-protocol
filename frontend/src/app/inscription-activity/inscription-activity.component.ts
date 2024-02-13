import { Component, OnInit } from '@angular/core';
import {
  AsteroidService,
  Inscription,
  InscriptionTradeHistory,
} from '../core/service/asteroid.service';
import { IonicModule } from '@ionic/angular';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { ShortenAddressMinPipe } from '../core/pipe/shorten-address-min.pipe';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-inscription-activity',
  templateUrl: './inscription-activity.component.html',
  styleUrl: './inscription-activity.component.scss',
  standalone: true,
  imports: [
    IonicModule,
    DateAgoPipe,
    ShortenAddressMinPipe,
    TokenDecimalsPipe,
    HumanTypePipe,
    RouterLink,
  ],
})
export class InscriptionActivityComponent implements OnInit {
  activity: InscriptionTradeHistory[] | undefined;

  constructor(
    private asteroidService: AsteroidService,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.activity = await this.asteroidService.getInscriptionTradeHistory();

    this.asteroidService
      .inscriptionTradeHistorySubscription()
      .on(({ inscription_trade_history }) => {
        this.activity = inscription_trade_history;
      });
  }

  openDetail(inscription: Inscription) {
    this.router.navigate(['/app/inscription', inscription.transaction.hash]);
  }
}
