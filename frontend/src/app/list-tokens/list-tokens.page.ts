import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-tokens',
  templateUrl: './list-tokens.page.html',
  styleUrls: ['./list-tokens.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink]
})
export class ListTokensPage implements OnInit {

  isLoading = true;
  selectedAddress: string = '';
  tokens: any = null;
  holdings: any = null;

  constructor(private activatedRoute: ActivatedRoute) {
  }

  async ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      this.selectedAddress = params["address"];
      this.isLoading = true;

      const chain = Chain(environment.api.endpoint);

      const tokensResult = await chain('query')({
        token: [
          {
            offset: 0,
            limit: 10,
            order_by: [
              {
                date_created: order_by.desc
              }
            ],
            where: {
              current_owner: {
                _eq: this.selectedAddress
              }
            }
          }, {
            id: true,
            transaction: {
              hash: true
            },
            current_owner: true,
            content_path: true,
            name: true,
            ticker: true,
            max_supply: true,
            decimals: true,
            launch_timestamp: true,
            date_created: true
          }
        ]
      });
      this.tokens = tokensResult.token;

      const holderResult = await chain('query')({
        token_holder: [
          {
            offset: 0,
            limit: 100,
            where: {
              address: {
                _eq: this.selectedAddress
              }
            }
          },
          {
            token: {
              ticker: true,
              max_supply: true,
              circulating_supply: true,
              decimals: true,
              transaction: {
                hash: true
              }
            },
            amount: true,
            date_updated: true,
          }
        ]
      });

      this.holdings = holderResult.token_holder;
      this.isLoading = false;
    });





  }

  onIonInfinite(event: Event) {
    console.log("LOAD MORE");
    // this.generateItems();
    // setTimeout(() => {
    //   (ev as InfiniteScrollCustomEvent).target.complete();
    // }, 500);
  }

}
