import { Chain, Subscription } from '../helpers/zeus.js'
import { Ops } from '../zeus/const.js'
import {
  GenericOperation,
  GraphQLTypes,
  InputType,
  OperationOptions,
  Selector,
  ValueTypes,
} from '../zeus/index.js'

export * from '../zeus/index.js'

export type ScalarDefinition = {
  smallint: {
    encode: (e: unknown) => string
    decode: (e: unknown) => number
  }
  bigint: {
    encode: (e: unknown) => string
    decode: (e: unknown) => number
  }
  numeric: {
    encode: (e: unknown) => string
    decode: (e: unknown) => number
  }
  timestamp: {
    encode: (e: unknown) => string
    decode: (e: unknown) => string
  }
  json: {
    encode: (e: unknown) => string
    decode: (e: unknown) => string
  }
}

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
) => Promise<InputType<GraphQLTypes[R], Z, SCLR>>

const listingSelector = Selector('marketplace_listing')({
  seller_address: true,
  total: true,
  deposit_total: true,
  is_deposited: true,
  is_cancelled: true,
  is_filled: true,
})

export type Listing = InputType<
  GraphQLTypes['marketplace_listing'],
  typeof listingSelector,
  ScalarDefinition
>

export class AsteroidService {
  chain: Chain
  subscription?: Subscription

  constructor(url: string, wsEnabled = false) {
    this.chain = Chain(url)
    if (wsEnabled) {
      this.subscription = Subscription(url)
    }
  }

  get query(): Operations<'query', ScalarDefinition> {
    return this.chain<'query', ScalarDefinition>('query') as Operations<
      'query',
      ScalarDefinition
    >
  }

  async fetchListing(listingHash: string): Promise<Listing | undefined> {
    const res = await this.query({
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: listingHash,
              },
            },
          },
        },
        listingSelector,
      ],
    })
    return res.marketplace_listing[0]
  }
}
