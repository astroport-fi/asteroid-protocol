import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonButton, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { Chain } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mint',
  templateUrl: 'mint.page.html',
  styleUrls: ['mint.page.scss'],
  standalone: true,
  imports: [IonContent, RouterModule, CommonModule, IonButton],
})
export class MintPage {
  isLoading = false;
  token: any;

  constructor(private activatedRoute: ActivatedRoute) {
  }

  async ngOnInit() {
    this.isLoading = true;
    const chain = Chain(environment.api.endpoint)

    const result = await chain('query')({
      token: [
        {
          where: {
            ticker: {
              _eq: this.activatedRoute.snapshot.params["ticker"].toUpperCase() // Always stored in uppercase
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
    this.isLoading = false;
  }

  async mint() {
    console.log("MINT", this.token.per_wallet_limit, this.token.ticker);
  }
}
