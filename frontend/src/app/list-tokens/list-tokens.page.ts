import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollCustomEvent, IonicModule } from '@ionic/angular';
import { Chain, order_by } from '../core/types/zeus';
import { environment } from 'src/environments/environment';
import { DateAgoPipe } from '../core/pipe/date-ago.pipe';
import { HumanTypePipe } from '../core/pipe/human-type.pipe';
import { HumanSupplyPipe } from '../core/pipe/human-supply.pipe';
import { TokenDecimalsPipe } from '../core/pipe/token-with-decimals.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { PriceService } from '../core/service/price.service';
import { SortEvent } from 'primeng/api';

@Component({
  selector: 'app-list-tokens',
  templateUrl: './list-tokens.page.html',
  styleUrls: ['./list-tokens.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, TableModule]
})
export class ListTokensPage implements OnInit {

  isLoading = true;
  selectedAddress: string = '';
  tokens: any = null;
  holdings: any = null;
  offset = 0;
  limit = 6000;
  lastFetchCount = 0;
  baseTokenPrice: number = 0;

  constructor(private activatedRoute: ActivatedRoute, private priceService: PriceService) {
    this.lastFetchCount = this.limit;
  }

  async ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      this.selectedAddress = params["address"];
      this.isLoading = true;

      this.baseTokenPrice = await this.priceService.fetchBaseTokenUSDPrice();

      const chain = Chain(environment.api.endpoint);

      const tokensResult = await chain('query')({
        token: [
          {
            offset: this.offset,
            limit: this.limit,
            order_by: [
              {
                id: order_by.asc
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
            circulating_supply: true,
            decimals: true,
            launch_timestamp: true,
            last_price_base: true,
            volume_24_base: true,
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

  customSort(event: SortEvent) {
    if (event.field == 'minted') {
      event.data?.sort((data1, data2) => {

        let value1 = parseInt(data1["circulating_supply"]) / parseInt(data1["max_supply"]);
        let value2 = parseInt(data2["circulating_supply"]) / parseInt(data2["max_supply"]);
        let result = null;

        if (value1 == null && value2 != null) result = -1;
        else if (value1 != null && value2 == null) result = 1;
        else if (value1 == null && value2 == null) result = 0;
        else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

        return event.order as number * result;
      });

    }

    event.data?.sort((data1, data2) => {
      let value1 = data1[event.field as string];
      let value2 = data2[event.field as string];
      let result = null;

      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
      else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

      return event.order as number * result;
    });
  }



}
