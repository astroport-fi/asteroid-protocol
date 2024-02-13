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

type First<T extends unknown> = T extends [any, ...infer R]
  ? T extends [...infer F, ...R]
    ? F[0]
    : never
  : never;

export type QueryOptions<T extends keyof ValueTypes['query_root']> = First<
  ValueTypes['query_root'][T]
>;

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

const inscriptionSelector = Selector('inscription')({
  id: true,
  transaction: {
    hash: true,
  },
  content_path: true,
  is_explicit: true,
  __alias: {
    name: {
      metadata: [
        {
          path: '$.metadata.name',
        },
        true,
      ],
    },
    description: {
      metadata: [
        {
          path: '$.metadata.description',
        },
        true,
      ],
    },
    mime: {
      metadata: [
        {
          path: '$.metadata.mime',
        },
        true,
      ],
    },
  },
});

export type Inscription = InputType<
  GraphQLTypes['inscription'],
  typeof inscriptionSelector,
  ScalarDefinition
>;

const inscriptionTradeHistorySelector = Selector('inscription_trade_history')({
  id: true,
  amount_quote: true,
  total_usd: true,
  seller_address: true,
  buyer_address: true,
  date_created: true,
  inscription: inscriptionSelector,
});

export type InscriptionTradeHistory = InputType<
  GraphQLTypes['inscription_trade_history'],
  typeof inscriptionTradeHistorySelector,
  ScalarDefinition
>;

@Injectable({
  providedIn: 'root',
})
export class AsteroidService {
  chain: Chain;
  ws: Subscription;

  constructor() {
    this.chain = Chain(environment.api.endpoint);
    this.ws = Subscription(environment.api.wss);
  }

  get query(): Operations<'query', ScalarDefinition> {
    return this.chain<'query', ScalarDefinition>('query') as Operations<
      'query',
      ScalarDefinition
    >;
  }

  async getInscriptionTradeHistory(
    offset = 0,
    limit = 500,
  ): Promise<InscriptionTradeHistory[]> {
    const result = await this.query({
      inscription_trade_history: [
        {
          offset,
          limit,
          order_by: [
            {
              date_created: order_by.desc,
            },
          ],
        },
        inscriptionTradeHistorySelector,
      ],
    });
    return result.inscription_trade_history;
  }

  inscriptionTradeHistorySubscription(offset = 0, limit = 500) {
    return this.ws<'subscription', ScalarDefinition>('subscription')({
      inscription_trade_history: [
        {
          offset,
          limit,
          order_by: [
            {
              date_created: order_by.desc,
            },
          ],
        },
        inscriptionTradeHistorySelector,
      ],
    });
  }
}
