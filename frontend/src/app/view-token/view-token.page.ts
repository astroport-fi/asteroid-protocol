import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Chain } from '../core/types/zeus';
import { ShortenAddressPipe } from '../core/pipe/shorten-address.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';


@Component({
  selector: 'app-view-token',
  templateUrl: './view-token.page.html',
  styleUrls: ['./view-token.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ShortenAddressPipe, RouterLink, DatePipe, HumanSupplyPipe, TokenDecimalsPipe]
})
export class ViewTokenPage implements OnInit {
  isLoading = false;
  token: any;
  explorerTxUrl: string = environment.api.explorer;
  tokenLaunchDate: Date;
  tokenIsLaunched: boolean = false;

  constructor(private activatedRoute: ActivatedRoute) {
    this.tokenLaunchDate = new Date();
  }

  async ngOnInit() {
    this.isLoading = true;

    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      token: [
        {
          where: {
            transaction_hash: {
              _eq: this.activatedRoute.snapshot.params["txhash"]
            }
          }
        }, {
          id: true,
          height: true,
          transaction_hash: true,
          creator: true,
          current_owner: true,
          name: true,
          ticker: true,
          decimals: true,
          max_supply: true,
          per_wallet_limit: true,
          launch_timestamp: true,
          content_path: true,
          content_size_bytes: true,
          date_created: true,
        }
      ]
    });

    this.token = result.token[0];
    this.tokenLaunchDate = new Date(this.token.launch_timestamp * 1000);
    if (this.tokenLaunchDate.getTime() < Date.now()) {
      this.tokenIsLaunched = true;
    }
    this.isLoading = false;
  }

}
