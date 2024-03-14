import { Chain, Subscription } from '../helpers/zeus.js'
import { Ops } from '../zeus/const.js'
import {
  ExtractVariables,
  GenericOperation,
  GraphQLTypes,
  InputType,
  OperationOptions,
  Selector,
  SubscriptionToGraphQL,
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
  jsonb: {
    encode: (e: unknown) => string
    decode: (e: unknown) => unknown
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

export type OperationsWS<
  O extends keyof typeof Ops,
  SCLR extends ScalarDefinition,
  R extends keyof ValueTypes = GenericOperation<O>,
> = <Z extends ValueTypes[R]>(
  o: (Z & ValueTypes[R]) | ValueTypes[R],
  ops?: OperationOptions & { variables?: ExtractVariables<Z> },
) => SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>

type First<T> = T extends [unknown, ...infer R]
  ? T extends [...infer F, ...R]
    ? F[0]
    : never
  : never

export type QueryOptions<T extends keyof ValueTypes['query_root']> = First<
  ValueTypes['query_root'][T]
>

export type WSSubscription<T> = {
  ws: WebSocket
  on: (fn: (args: T) => void) => void
  off: (
    fn: (e: {
      data?: T
      code?: number
      reason?: string
      message?: string
    }) => void,
  ) => void
  error: (fn: (e: { data?: T; errors?: string[] }) => void) => void
  open: () => void
}

export const statusSelector = Selector('status')({
  base_token: true,
  base_token_usd: true,
  last_processed_height: true,
  last_known_height: true,
})

export type Status = InputType<
  GraphQLTypes['status'],
  typeof statusSelector,
  ScalarDefinition
>

const listingSelector = Selector('marketplace_listing')({
  seller_address: true,
  total: true,
  deposit_total: true,
  depositor_address: true,
  depositor_timedout_block: true,
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
  ws?: Subscription

  constructor(url: string, wsUrl = '') {
    this.chain = Chain(url)
    if (wsUrl) {
      this.ws = Subscription(wsUrl)
    }
  }

  get query(): Operations<'query', ScalarDefinition> {
    return this.chain<'query', ScalarDefinition>('query') as Operations<
      'query',
      ScalarDefinition
    >
  }

  get subscription(): OperationsWS<'subscription', ScalarDefinition> {
    if (!this.ws) {
      throw new Error('You must instantiate AsteroidService with wsUrl')
    }

    return this.ws<'subscription', ScalarDefinition>(
      'subscription',
    ) as OperationsWS<'subscription', ScalarDefinition>
  }

  async getStatus(chainId: string): Promise<Status> {
    const statusResult = await this.query({
      status: [
        {
          where: {
            chain_id: {
              _eq: chainId,
            },
          },
        },
        statusSelector,
      ],
    })

    return statusResult.status[0]
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
