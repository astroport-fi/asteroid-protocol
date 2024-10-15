import {
  AsteroidService,
  ValueTypes,
  order_by,
} from '@asteroid-protocol/sdk/client'
import { aggregateCountSelector } from '~/api/common'
import { Inscription, inscriptionSelector } from './inscription'
import { MintReservation, mintReservationSelector } from './launchpad'
import { statusSelector } from './status'
import { TrollPost, trollPostSelector } from './trollbox'

export type InscriptionsResult = {
  inscriptions: Inscription[]
  count: number
}

export interface TrollPosts {
  posts: TrollPost[]
  count: number
}

export class AsteroidClient extends AsteroidService {
  constructor(url: string, wssUrl?: string) {
    super(url, wssUrl)
  }

  async getTransactionStatus(txHash: string) {
    const result = await this.query({
      transaction: [
        {
          where: {
            hash: {
              _eq: txHash,
            },
          },
        },
        {
          status_message: true,
        },
      ],
    })

    const transaction = result.transaction[0]
    if (!transaction) {
      return
    }

    return transaction.status_message
  }

  async getUserInscriptions(
    address: string,
    offset: number,
    limit: number,
    where: {
      collectionSymbolSearch?: string
    } = {},
  ): Promise<InscriptionsResult> {
    const queryWhere: ValueTypes['inscription_bool_exp'] = {
      current_owner: {
        _eq: address,
      },
    }

    if (where.collectionSymbolSearch) {
      queryWhere.collection = {
        symbol: {
          _ilike: `${where.collectionSymbolSearch}%`,
        },
      }
    }

    const res = await this.query({
      inscription: [
        {
          limit,
          offset,
          where: queryWhere,
          order_by: [{ id: order_by.desc }],
        },
        inscriptionSelector,
      ],
      inscription_aggregate: [
        {
          where: queryWhere,
        },
        aggregateCountSelector,
      ],
    })
    return {
      inscriptions: res.inscription,
      count:
        res.inscription_aggregate.aggregate?.count ?? res.inscription.length,
    } as InscriptionsResult
  }

  async getUserMintReservations(
    address: string,
    where: {
      collectionSymbolSearch?: string
    } = {},
  ): Promise<MintReservation[]> {
    const queryWhere: ValueTypes['launchpad_mint_reservation_bool_exp'] = {
      address: {
        _eq: address,
      },
      is_minted: {
        _eq: false,
      },
      is_expired: {
        _eq: false,
      },
    }

    if (where.collectionSymbolSearch) {
      queryWhere.launchpad = {
        collection: {
          symbol: {
            _ilike: `${where.collectionSymbolSearch}%`,
          },
        },
      }
    }

    const result = await this.query({
      launchpad_mint_reservation: [
        {
          where: queryWhere,
          order_by: [
            {
              id: order_by.desc,
            },
          ],
        },
        mintReservationSelector,
      ],
    })

    return result.launchpad_mint_reservation
  }

  async getTrollPost(trollId: number): Promise<TrollPost | undefined> {
    const result = await this.query({
      troll_post: [
        {
          where: {
            id: {
              _eq: trollId,
            },
          },
        },
        trollPostSelector,
      ],
    })

    return result.troll_post[0]
  }

  async getTrollPosts(
    offset: number,
    limit: number,
    where: {
      creator?: string
      search?: string | null
    } = {},
    orderBy?: ValueTypes['troll_post_order_by'],
  ): Promise<TrollPosts> {
    if (!orderBy) {
      orderBy = {
        date_created: order_by.desc,
      }
    }

    const queryWhere: ValueTypes['troll_post_bool_exp'] | undefined = {}
    if (where.creator) {
      queryWhere.creator = {
        _eq: where.creator,
      }
    }

    if (where.search) {
      queryWhere.text = {
        _ilike: `%${where.search}%`,
      }
    }

    const result = await this.query({
      troll_post: [
        {
          offset,
          limit,
          where: queryWhere,
          order_by: [orderBy],
        },
        trollPostSelector,
      ],
      troll_post_aggregate: [
        {
          where: queryWhere,
        },
        aggregateCountSelector,
      ],
    })

    return {
      posts: result.troll_post,
      count:
        result.troll_post_aggregate.aggregate?.count ??
        result.troll_post.length,
    }
  }

  statusSubscription(chainId: string) {
    return this.ws!('subscription')({
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
  }
}
