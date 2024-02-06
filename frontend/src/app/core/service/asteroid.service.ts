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
  R extends keyof ValueTypes = GenericOperation<O>
> = <Z extends ValueTypes[R]>(
  o: (Z & ValueTypes[R]) | ValueTypes[R],
  ops?: OperationOptions & { variables?: Record<string, unknown> }
) => Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

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
}
