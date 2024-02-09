import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Chain, Subscription } from '../helpers/zeus';
import { Ops } from '../types/zeus/const';
import {
  GenericOperation,
  GraphQLTypes,
  InputType,
  OperationOptions,
  Selector,
  ValueTypes,
  marketplace_cft20_detail_select_column,
  order_by,
} from '../types/zeus/index';

export type ScalarDefinition = {
  smallint: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => number;
  };
  bigint: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => number;
  };
  numeric: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => number;
  };
  timestamp: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => string;
  };
  json: {
    encode: (e: unknown) => string;
    decode: (e: unknown) => string;
  };
};

// O - operation - query | mutation | subscription
// SCLR - scalar definition to handle custom types like bigint, json,..
// R - concrete query type
// Z - concrete query selection
export type Operations<
  O extends keyof typeof Ops,
  SCLR extends ScalarDefinition,
  R extends keyof ValueTypes = GenericOperation<O>,
> = <Z extends ValueTypes[R]>(
  o: (Z & ValueTypes[R]) | ValueTypes[R],
  ops?: OperationOptions & { variables?: Record<string, unknown> },
) => Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

const tokenSelector = Selector('token')({
  id: true,
  name: true,
  ticker: true,
  decimals: true,
  launch_timestamp: true,
  content_path: true,
  circulating_supply: true,
  last_price_base: true,
  volume_24_base: true,
  date_created: true,
});

export type Token = InputType<
  GraphQLTypes['token'],
  typeof tokenSelector,
  ScalarDefinition
>;

const tokenHolderSelector = Selector('token_holder')({
  token: tokenSelector,
  amount: true,
  date_updated: true,
});

export type TokenHolding = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenHolderSelector,
  ScalarDefinition
>;

const statusSelector = Selector('status')({
  base_token: true,
  base_token_usd: true,
  last_processed_height: true,
});

export type Status = InputType<
  GraphQLTypes['status'],
  typeof statusSelector,
  ScalarDefinition
>;

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

export type CFT20MarketplaceListing = InputType<
  GraphQLTypes['marketplace_cft20_detail'],
  typeof cft20ListingSelector,
  ScalarDefinition
>;

export type TokenListings = {
  listings: CFT20MarketplaceListing[];
  count: number;
};

@Injectable({
  providedIn: 'root',
})
export class AsteroidService {
  chain: Chain;
  subscription?: Subscription;

  constructor() {
    this.chain = Chain(environment.api.endpoint);
    this.subscription = Subscription(environment.api.wss);
  }

  get query(): Operations<'query', ScalarDefinition> {
    return this.chain<'query', ScalarDefinition>('query') as Operations<
      'query',
      ScalarDefinition
    >;
  }

  async getStatus(): Promise<Status | undefined> {
    const statusResult = await this.query({
      status: [
        {
          where: {
            chain_id: {
              _eq: environment.chain.chainId,
            },
          },
        },
        statusSelector,
      ],
    });

    return statusResult.status[0];
  }

  async getToken(ticker: string): Promise<Token | undefined> {
    const result = await this.query({
      token: [
        {
          where: {
            ticker: {
              _eq: ticker,
            },
          },
        },
        tokenSelector,
      ],
    });
    return result.token[0];
  }

  async getTokenHolding(
    tokenId: number,
    address: string,
  ): Promise<TokenHolding | undefined> {
    const result = await this.query({
      token_holder: [
        {
          where: {
            address: {
              _eq: address,
            },
            token_id: {
              _eq: tokenId,
            },
          },
        },
        tokenHolderSelector,
      ],
    });
    return result.token_holder[0];
  }

  async getTokenHoldings(
    address: string,
    search?: string | null,
    offset = 0,
    limit = 500,
  ): Promise<TokenHolding[]> {
    let where: ValueTypes['token_holder_bool_exp'] = {
      address: {
        _eq: address,
      },
    };
    if (search) {
      where.token = {
        _or: [
          { name: { _like: `%${search}%` } },
          { name: { _like: `%${search.toUpperCase()}%` } },
          { ticker: { _like: `%${search}%` } },
          { ticker: { _like: `%${search.toUpperCase()}%` } },
        ],
      };
    }

    const holderResult = await this.query({
      token_holder: [
        {
          offset,
          limit,
          where,
        },
        tokenHolderSelector,
      ],
    });
    return holderResult.token_holder;
  }

  async getTokenListings(
    tokenId: number,
    offset: number = 0,
    limit: number = 20,
    orderBy?: ValueTypes['marketplace_cft20_detail_order_by'],
  ): Promise<TokenListings> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.asc,
      };
    }

    const where: ValueTypes['marketplace_cft20_detail_bool_exp'] = {
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
    };

    const listingsResult = await this.query({
      marketplace_cft20_detail_aggregate: [
        {
          where,
        },
        {
          aggregate: {
            count: [{}, true],
          },
        },
      ],
      marketplace_cft20_detail: [
        {
          where,
          offset,
          limit,
          order_by: [orderBy],
        },
        cft20ListingSelector,
      ],
    });
    return {
      count: listingsResult.marketplace_cft20_detail_aggregate.aggregate!.count,
      listings: listingsResult.marketplace_cft20_detail,
    };
  }

  async getTokenFloorPrice(tokenId: number) {
    const floorListings = await this.getTokenListings(tokenId, 0, 1, {
      ppt: order_by.asc,
    });
    const listing = floorListings.listings[0];
    if (!listing) {
      return 0;
    }
    return listing.ppt;
  }
}
