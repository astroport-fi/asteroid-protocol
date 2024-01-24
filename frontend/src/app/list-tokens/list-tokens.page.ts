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
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PriceService } from '../core/service/price.service';
import { LazyLoadEvent, SortEvent } from 'primeng/api';

@Component({
  selector: 'app-list-tokens',
  templateUrl: './list-tokens.page.html',
  styleUrls: ['./list-tokens.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DateAgoPipe, HumanTypePipe, DecimalPipe, HumanSupplyPipe, TokenDecimalsPipe, RouterLink, TableModule]
})
export class ListTokensPage implements OnInit {

  isLoading = true;
  isTableLoading: boolean = false;
  selectedAddress: string = '';
  tokens: any = null;
  offset = 0;
  limit = 20;
  lastFetchCount = 0;
  baseTokenPrice: number = 0;
  total: number = 0;
  chain: any;

  constructor(private activatedRoute: ActivatedRoute, private priceService: PriceService) {
    this.lastFetchCount = this.limit;
    this.chain = Chain(environment.api.endpoint);
  }

  async ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      this.selectedAddress = params["address"];
      this.isLoading = true;

      this.baseTokenPrice = await this.priceService.fetchBaseTokenUSDPrice();

      const tokensResult = await this.chain('query')({
        token: [
          {
            order_by: [
              { id: order_by.desc }
            ],
            limit: 1
          }, {
            id: true,
          }
        ]
      });
      this.total = tokensResult.token[0].id;

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

  async load(event: TableLazyLoadEvent) {
    console.log(event);
    this.isTableLoading = true;

    // Determine the sort order
    let sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';

    // Build the order_by clause based on the event.sortField and sortOrder
    let orderByClause: any = {};
    if (event.sortField) {
      orderByClause[event.sortField as string] = sortOrder;
    } else {
      // Default sorting, if no sortField is provided
      orderByClause = { id: 'asc' };
    }

    let whereClause: any = {};
    if (event.globalFilter) {
      const globalFilter = event.globalFilter as string;
      whereClause = {
        _or: [
          { name: { _like: `%${globalFilter}%` } },
          { name: { _like: `%${globalFilter.toUpperCase()}%` } },
          { ticker: { _like: `%${globalFilter}%` } },
          { ticker: { _like: `%${globalFilter.toUpperCase()}%` } },
        ]
      };
    }

    const tokensResult = await this.chain('query')({
      token: [
        {
          offset: event.first,
          limit: event.rows,
          order_by: [
            orderByClause
          ],
          where: whereClause
          // where: [
          //   whereClause
          // ]
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
    this.isTableLoading = false;
  }



}
