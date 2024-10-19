import {
  $,
  AsteroidService,
  QueryOptions,
  ValueTypes,
  WSSubscription,
  order_by,
} from '@asteroid-protocol/sdk/client'
import { aggregateCountSelector } from '~/api/common'
import {
  InscriptionDetail,
  InscriptionHistory,
  InscriptionTradeHistory,
  InscriptionType,
  InscriptionWithMarket,
  inscriptionDetailSelector,
  inscriptionHistorySelector,
  inscriptionListingSelector,
  inscriptionSelector,
  inscriptionTradeHistorySelector,
} from '~/api/inscription'
import { statusSelector } from '~/api/status'
import {
  MarketplaceTokenListing,
  Token,
  TokenAddressHistory,
  TokenHolder,
  TokenHolderAmount,
  TokenHolding,
  TokenMarket,
  TokenSupply,
  TokenTradeHistory,
  TokenType,
  tokenAddressHistorySelector,
  tokenDetailSelector,
  tokenHolderAmountSelector,
  tokenHolderSelector,
  tokenHoldingSelector,
  tokenListingSelector,
  tokenMarketTokenSelector,
  tokenSelector,
  tokenSupplySelector,
  tokenTradeHistorySelector,
} from '~/api/token'
import { getTwoUniqueRandomItems } from '~/utils/random'
import {
  BridgeHistory,
  TokenWithBridge,
  bridgeHistorySelector,
  bridgeSignatureHistorySelector,
  bridgeTokenSignatureSelector,
  tokenWithBridgeSelector,
} from './bridge'
import { clubStatsSelector } from './clubs'
import {
  Collection,
  CollectionDetail,
  CollectionsStatsItem,
  TopCollection,
  collectionDetailSelector,
  collectionSelector,
  collectionStatsItemSelector,
  collectionStatsSelector,
  topCollectionSelector,
} from './collection'
import {
  CreatorLaunch,
  Launchpad,
  LaunchpadDetail,
  LaunchpadItem,
  MintReservation,
  creatorLaunchSelector,
  launchpadDetailSelector,
  launchpadItemSelector,
  launchpadSelector,
  mintReservationSelector,
  stageDetailSelector,
} from './launchpad'
import {
  marketplaceListingSelector,
  oldMarketplaceListingSelector,
} from './marketplace'
import { TradeHistory, tradeHistorySelector } from './trade-history'
import { transactionHashSelector } from './transaction'

export type TokenMarketResult = {
  tokens: TokenMarket[]
  count: number
}

export type TokenListings = {
  listings: MarketplaceTokenListing[]
  count?: number
}

export type InscriptionsResult = {
  inscriptions: InscriptionWithMarket[]
  count: number
}

export type TokenHoldings = {
  holdings: TokenHolding[]
  count: number
}

export type TokensResult = {
  tokens: Token[]
  count: number
}

export type TokenHolders = {
  holders: TokenHolder[]
  count: number
}

export type TradeHistoryResult = {
  history: TradeHistory[]
  count: number
}

export type BridgeHistoryResult = {
  history: BridgeHistory[]
  count: number
}

export type Royalty = { recipient: string; percentage: number }

export interface TraitItem {
  trait_type: string
  value: string
}

export interface Collections {
  collections: Collection[]
  count: number
}

export type CollectionsStats = {
  stats: CollectionsStatsItem[]
  count?: number
}

export class AsteroidClient extends AsteroidService {
  constructor(url: string, wssUrl?: string) {
    super(url, wssUrl)
  }

  async getToken<T extends boolean = false>(
    ticker: string,
    detail = false as T,
    address?: string,
  ): Promise<TokenType<T> | undefined> {
    const queryOptions: QueryOptions<'token'> = {
      where: {
        ticker: {
          _eq: ticker,
        },
      },
    }

    let selector: ValueTypes['token'] = tokenSelector

    if (detail) {
      selector = tokenDetailSelector
    }

    if (address) {
      selector = {
        ...selector,
        token_holders: [
          {
            where: {
              address: {
                _eq: address,
              },
            },
          },
          tokenHolderAmountSelector,
        ],
      }
    }

    const result = await this.query({
      token: [queryOptions, selector],
    })
    return result.token[0] as TokenType<T> & {
      token_holders?: (TokenHolderAmount | undefined)[]
    }
  }

  async getTokenSupply(id: number): Promise<TokenSupply> {
    const result = await this.query({
      token: [
        {
          where: {
            id: {
              _eq: id,
            },
          },
        },
        tokenSupplySelector,
      ],
    })
    return result.token[0]
  }

  async getRoyalty(inscriptionId: number): Promise<Royalty | null> {
    const result = await this.query({
      inscription: [
        {
          where: {
            id: {
              _eq: inscriptionId,
            },
          },
        },
        {
          collection: {
            royalty_percentage: true,
            payment_address: true,
            creator: true,
          },
        },
      ],
    })
    if (
      result &&
      result.inscription[0] &&
      result.inscription[0].collection &&
      result.inscription[0].collection.royalty_percentage
    ) {
      const { collection } = result.inscription[0]

      if (collection.payment_address) {
        return {
          recipient: collection.payment_address,
          percentage: collection.royalty_percentage!,
        }
      }

      return {
        recipient: collection.creator,
        percentage: collection.royalty_percentage!,
      }
    }
    return null
  }

  async getTokens(
    offset: number,
    limit: number,
    where: {
      currentOwner?: string
    } = {},
    orderBy?: ValueTypes['token_order_by'],
  ): Promise<TokensResult> {
    if (!orderBy) {
      orderBy = {
        date_created: order_by.desc,
      }
    }

    const queryWhere: ValueTypes['token_bool_exp'] = {}
    if (where.currentOwner) {
      queryWhere.current_owner = {
        _eq: where.currentOwner,
      }
    }

    const result = await this.query({
      token: [
        {
          offset,
          limit,
          order_by: [orderBy],
          where: queryWhere,
        },
        tokenSelector,
      ],
      token_aggregate: [{ where: queryWhere }, aggregateCountSelector],
    })
    return {
      tokens: result.token,
      count: result.token_aggregate.aggregate?.count ?? result.token.length,
    }
  }

  async getTokenHolders(
    tokenId: number,
    offset: number,
    limit: number,
    orderBy?: ValueTypes['token_holder_order_by'],
  ): Promise<TokenHolders> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.desc,
      }
    }

    const where: ValueTypes['token_holder_bool_exp'] = {
      token_id: {
        _eq: tokenId,
      },
      amount: {
        _gt: 0,
      },
    }

    const result = await this.query({
      token_holder: [
        {
          offset,
          limit,
          order_by: [orderBy],
          where,
        },
        tokenHolderSelector,
      ],
      token_holder_aggregate: [{ where }, aggregateCountSelector],
    })
    return {
      holders: result.token_holder,
      count:
        result.token_holder_aggregate.aggregate?.count ??
        result.token_holder.length,
    }
  }

  async getTokenHolding(
    tokenId: number,
    address: string,
  ): Promise<number | undefined> {
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
        {
          amount: true,
        },
      ],
    })
    return result.token_holder[0]?.amount
  }

  async getTokenHoldings(
    address: string,
    offset = 0,
    limit = 500,
    search?: string | null,
    orderBy?: ValueTypes['token_holder_order_by'],
  ): Promise<TokenHoldings> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.desc,
      }
    }

    const where: ValueTypes['token_holder_bool_exp'] = {
      address: {
        _eq: address,
      },
    }
    if (search) {
      where.token = {
        _or: [
          { name: { _ilike: `%${search}%` } },
          { ticker: { _ilike: `%${search}%` } },
        ],
      }
    }

    const holderResult = await this.query({
      token_holder: [
        {
          offset,
          limit,
          where,
          order_by: [orderBy],
        },
        tokenHoldingSelector,
      ],
      token_holder_aggregate: [{ where }, aggregateCountSelector],
    })
    return {
      holdings: holderResult.token_holder,
      count:
        holderResult.token_holder_aggregate.aggregate?.count ??
        holderResult.token_holder.length,
    }
  }

  async getTokenMarkets(
    offset: number = 0,
    limit: number = 20,
    where: {
      userAddress?: string
      search?: string | null
    } = {},
    orderBy?: ValueTypes['token_order_by'],
  ): Promise<TokenMarketResult> {
    if (!orderBy) {
      orderBy = {
        id: order_by.desc,
      }
    }

    let tokenHolders:
      | [QueryOptions<'token_holder'>, { amount: boolean }]
      | undefined = undefined
    if (where.userAddress) {
      tokenHolders = [
        {
          where: {
            address: {
              _eq: where.userAddress,
            },
          },
        },
        {
          amount: true,
        },
      ]
    }

    let queryWhere: ValueTypes['token_bool_exp'] | undefined
    if (where.search) {
      queryWhere = {
        _or: [
          { name: { _like: `%${where.search}%` } },
          { name: { _like: `%${where.search.toUpperCase()}%` } },
          { ticker: { _like: `%${where.search}%` } },
          { ticker: { _like: `%${where.search.toUpperCase()}%` } },
        ],
      }
    }

    const result = await this.query({
      token_aggregate: [{ where: queryWhere }, aggregateCountSelector],
      token: [
        { offset, limit, order_by: [orderBy], where: queryWhere },
        {
          ...tokenMarketTokenSelector,
          token_holders: tokenHolders,
          marketplace_cft20_details_aggregate: [
            {
              where: {
                marketplace_listing: {
                  is_cancelled: {
                    _eq: false,
                  },
                  is_filled: {
                    _eq: false,
                  },
                },
              },
            },
            {
              aggregate: {
                count: [{}, true],
              },
            },
          ],
        },
      ],
    })
    return {
      tokens: result.token,
      count: result.token_aggregate.aggregate?.count ?? result.token.length,
    }
  }

  async getOldMarketplaceListings(
    tokenId: number,
    seller: string,
    offset: number = 0,
    limit: number = 100,
  ) {
    const result = await this.query({
      token_open_position: [
        {
          where: {
            token_id: {
              _eq: tokenId,
            },
            is_cancelled: {
              _eq: false,
            },
            is_filled: {
              _eq: false,
            },
            seller_address: {
              _eq: seller,
            },
          },
          offset,
          limit,
          order_by: [{ id: order_by.desc }],
        },
        oldMarketplaceListingSelector,
      ],
    })
    return result.token_open_position
  }

  async getTokenListings(
    tokenId: number,
    offset: number = 0,
    limit: number = 20,
    orderBy?: ValueTypes['marketplace_cft20_detail_order_by'],
    aggregate = false,
    where: { seller?: string; depositor?: string; currentBlock?: number } = {},
  ): Promise<TokenListings> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.asc,
      }
    }

    const queryWhere: ValueTypes['marketplace_cft20_detail_bool_exp'] = {
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
    }

    if (where.seller) {
      queryWhere.marketplace_listing = Object.assign(
        queryWhere.marketplace_listing || {},
        {
          seller_address: {
            _eq: where.seller,
          },
        },
      )
    }

    if (where.depositor && where.currentBlock) {
      queryWhere.marketplace_listing = Object.assign(
        queryWhere.marketplace_listing || {},
        {
          depositor_address: {
            _eq: where.seller,
          },
          depositor_timedout_block: {
            _gt: where.currentBlock,
          },
          is_deposited: {
            _eq: true,
          },
        },
      )
    }

    type Query = {
      marketplace_cft20_detail: [
        QueryOptions<'marketplace_cft20_detail'>,
        typeof tokenListingSelector,
      ]
      marketplace_cft20_detail_aggregate?: [
        QueryOptions<'marketplace_cft20_detail_aggregate'>,
        typeof aggregateCountSelector,
      ]
    }

    const query: Query = {
      marketplace_cft20_detail: [
        {
          where: queryWhere,
          offset,
          limit,
          order_by: [orderBy],
        },
        tokenListingSelector,
      ],
    }

    if (aggregate) {
      query.marketplace_cft20_detail_aggregate = [
        {
          where: queryWhere,
        },
        {
          aggregate: {
            count: [{}, true],
          },
        },
      ]
    }

    const listingsResult = await this.query(query)

    let count: number | undefined
    if (aggregate) {
      count =
        listingsResult.marketplace_cft20_detail_aggregate?.aggregate?.count
    }

    return {
      count,
      listings: listingsResult.marketplace_cft20_detail,
    }
  }

  tokenListingsSubscription(
    tokenId: number,
    limit: number,
  ): WSSubscription<{ marketplace_cft20_detail: MarketplaceTokenListing[] }> {
    return this.subscription({
      marketplace_cft20_detail: [
        {
          where: {
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
          },
          limit,
          order_by: [
            {
              ppt: order_by.asc,
            },
          ],
        },
        tokenListingSelector,
      ],
    })
  }

  async getTokenFloorPrice(tokenId: number) {
    const floorListings = await this.getTokenListings(tokenId, 0, 1, {
      ppt: order_by.asc,
    })
    const listing = floorListings.listings[0]
    if (!listing) {
      return 0
    }
    return listing.ppt
  }

  async getTopCollections(): Promise<TopCollection[]> {
    const result = await this.query({
      __alias: {
        new: {
          collection_stats: [
            {
              limit: 8,
              order_by: [{ id: order_by.desc }],
              where: { supply: { _gt: 0 } },
            },
            {
              collection: topCollectionSelector,
            },
          ],
        },
        top: {
          collection_stats: [
            {
              limit: 8,
              order_by: [{ volume: order_by.desc }],
              where: { supply: { _gt: 0 } },
            },
            {
              collection: topCollectionSelector,
            },
          ],
        },
        trending: {
          collection_stats: [
            {
              limit: 8,
              order_by: [
                {
                  volume_24h: order_by.desc,
                },
                {
                  volume_7d: order_by.desc,
                },
                {
                  volume: order_by.desc,
                },
              ],
              where: { supply: { _gt: 0 } },
            },
            {
              collection: topCollectionSelector,
            },
          ],
        },
      },
    })

    const selectedSet = new Set<number>()

    let topCollections = getTwoUniqueRandomItems(
      selectedSet,
      result.top.map((c) => c.collection!),
    )
    topCollections = topCollections.concat(
      getTwoUniqueRandomItems(
        selectedSet,
        result.trending.map((c) => c.collection!),
      ),
    )
    topCollections = topCollections.concat(
      getTwoUniqueRandomItems(
        selectedSet,
        result.new.map((c) => c.collection!),
      ),
    )

    return topCollections as TopCollection[]
  }

  async getEmptyCollections(
    creator: string,
    orderBy?: ValueTypes['empty_collections_order_by'],
  ): Promise<Collection[]> {
    if (!orderBy) {
      orderBy = {
        collection: {
          date_created: order_by.desc,
        },
      }
    }

    const result = await this.query({
      empty_collections: [
        {
          where: {
            collection: {
              creator: {
                _eq: creator,
              },
            },
          },
          order_by: [orderBy],
        },
        {
          collection: collectionSelector,
        },
      ],
    })

    return result.empty_collections.map((item) => item.collection as Collection)
  }

  async getCollections(
    offset: number,
    limit: number,
    where: {
      creator?: string
      search?: string | null
    } = {},
    orderBy?: ValueTypes['collection_order_by'],
  ): Promise<Collections> {
    if (!orderBy) {
      orderBy = {
        date_created: order_by.desc,
      }
    }

    const queryWhere: ValueTypes['collection_bool_exp'] | undefined = {}
    if (where.creator) {
      queryWhere.creator = {
        _eq: where.creator,
      }
    }

    if (where.search) {
      queryWhere.name = {
        _ilike: `%${where.search}%`,
      }
    }

    const result = await this.query({
      collection: [
        {
          offset,
          limit,
          where: queryWhere,
          order_by: [orderBy],
        },
        collectionSelector,
      ],
      collection_aggregate: [
        {
          where: queryWhere,
        },
        aggregateCountSelector,
      ],
    })

    return {
      collections: result.collection,
      count:
        result.collection_aggregate.aggregate?.count ??
        result.collection.length,
    }
  }

  async getCollectionsStats(
    orderBy: Array<ValueTypes['collection_stats_order_by']>,
    where: {
      search?: string | null
    } = {},
    offset: number = 0,
    limit: number = 15,
    aggregate = false,
  ): Promise<CollectionsStats> {
    let queryWhere: ValueTypes['collection_stats_bool_exp'] | undefined
    if (where.search) {
      queryWhere = {
        collection: {
          name: {
            _ilike: `%${where.search}%`,
          },
        },
      }
    }

    type Query = {
      collection_stats: [
        QueryOptions<'collection_stats'>,
        typeof collectionStatsItemSelector,
      ]
      collection_stats_aggregate?: [
        QueryOptions<'collection_stats_aggregate'>,
        typeof aggregateCountSelector,
      ]
    }

    const query: Query = {
      collection_stats: [
        {
          where: queryWhere,
          offset,
          limit,
          order_by: orderBy,
        },
        collectionStatsItemSelector,
      ],
    }

    if (aggregate) {
      query.collection_stats_aggregate = [
        {
          where: queryWhere,
        },
        {
          aggregate: {
            count: [{}, true],
          },
        },
      ]
    }

    const result = await this.query(query)
    let count: number | undefined
    if (aggregate) {
      count = result.collection_stats_aggregate?.aggregate?.count
    }

    return {
      count,
      stats: result.collection_stats as CollectionsStatsItem[],
    }
  }

  async getCollectionStats(collectionId: number) {
    const result = await this.query({
      collection_stats: [
        {
          where: {
            id: {
              _eq: collectionId,
            },
          },
        },
        collectionStatsSelector,
      ],
    })
    return result.collection_stats[0]
  }

  async getClubStats(maxId: number) {
    const result = await this.query({
      club_stats: [
        {
          args: {
            max_id: maxId,
          },
        },
        clubStatsSelector,
      ],
    })
    return result.club_stats[0]
  }

  async getCollection(symbol: string): Promise<CollectionDetail | undefined> {
    const result = await this.query({
      collection: [
        {
          where: {
            symbol: {
              _eq: symbol,
            },
          },
        },
        collectionDetailSelector,
      ],
    })
    return result.collection[0] as CollectionDetail | undefined
  }

  async getCollectionById(id: number): Promise<CollectionDetail | undefined> {
    const result = await this.query({
      collection: [
        {
          where: {
            id: {
              _eq: id,
            },
          },
        },
        collectionDetailSelector,
      ],
    })
    return result.collection[0] as CollectionDetail | undefined
  }

  async getInscriptionWithMarket(
    hash: string,
  ): Promise<InscriptionWithMarket<InscriptionDetail> | undefined> {
    const result = await this.query({
      inscription: [
        {
          where: {
            transaction: {
              hash: {
                _eq: hash,
              },
            },
          },
        },
        {
          ...inscriptionDetailSelector,
          marketplace_inscription_details: [
            {
              where: {
                marketplace_listing: {
                  is_cancelled: { _eq: false },
                  is_filled: { _eq: false },
                },
              },
            },
            inscriptionListingSelector,
          ],
        },
      ],
    })

    const inscription = result.inscription[0]

    return {
      ...inscription,
      marketplace_listing:
        inscription?.marketplace_inscription_details?.[0]?.marketplace_listing,
    } as InscriptionWithMarket<InscriptionDetail>
  }

  async getInscription<T extends boolean = false>(
    hash: string,
    detail = false as T,
  ): Promise<InscriptionType<T> | undefined> {
    let selector: ValueTypes['inscription'] = inscriptionSelector

    if (detail) {
      selector = inscriptionDetailSelector
    }

    const result = await this.query({
      inscription: [
        {
          where: {
            transaction: {
              hash: {
                _eq: hash,
              },
            },
          },
        },
        selector,
      ],
    })
    return result.inscription[0] as unknown as InscriptionType<T>
  }

  async getReservedInscriptions(
    depositor: string,
    currentBlock: number,
    limit: number,
  ): Promise<InscriptionWithMarket[]> {
    const res = await this.query({
      marketplace_inscription_detail: [
        {
          where: {
            marketplace_listing: {
              is_cancelled: {
                _eq: false,
              },
              is_filled: {
                _eq: false,
              },
              is_deposited: {
                _eq: true,
              },
              depositor_address: {
                _eq: depositor,
              },
              depositor_timedout_block: {
                _gt: currentBlock,
              },
            },
          },
          limit,
          order_by: [
            {
              id: order_by.asc,
            },
          ],
        },
        {
          inscription: {
            ...inscriptionSelector,
          },
          marketplace_listing: {
            ...marketplaceListingSelector,
          },
        },
      ],
    })

    return res.marketplace_inscription_detail.map((i) => ({
      ...i.inscription!,
      marketplace_listing: i.marketplace_listing,
    })) as InscriptionWithMarket[]
  }

  async getUserListedInscriptions(
    address: string,
    offset: number,
    limit: number,
    where: {
      collectionSymbolSearch?: string
    } = {},
  ): Promise<InscriptionsResult> {
    const queryWhere: ValueTypes['marketplace_inscription_detail_bool_exp'] = {
      marketplace_listing: {
        seller_address: {
          _eq: address,
        },
        is_cancelled: {
          _eq: false,
        },
        is_filled: {
          _eq: false,
        },
      },
    }

    if (where.collectionSymbolSearch) {
      queryWhere.inscription = {
        collection: {
          symbol: {
            _ilike: `${where.collectionSymbolSearch}%`,
          },
        },
      }
    }

    const res = await this.query({
      marketplace_inscription_detail: [
        {
          limit,
          offset,
          where: queryWhere,
          order_by: [{ id: order_by.desc }],
        },
        {
          inscription: inscriptionSelector,
          marketplace_listing: marketplaceListingSelector,
        },
      ],
      marketplace_inscription_detail_aggregate: [
        {
          where: queryWhere,
        },
        aggregateCountSelector,
      ],
    })
    return {
      inscriptions: res.marketplace_inscription_detail.map((i) => ({
        ...i.inscription!,
        marketplace_listing: i.marketplace_listing,
      })),
      count:
        res.marketplace_inscription_detail_aggregate.aggregate?.count ??
        res.marketplace_inscription_detail.length,
    } as InscriptionsResult
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

  async getInscriptions(
    offset: number,
    limit: number,
    where: {
      collectionId?: number
      currentOwner?: string
      onlySingle?: boolean
      onlyBuy?: boolean
      inscriptionNumberLTE?: number
      priceGTE?: number
      priceLTE?: number
      search?: string | null
      traitFilters?: TraitItem[][]
    } = {},
    orderBy?: ValueTypes['inscription_market_order_by'],
  ): Promise<InscriptionsResult> {
    const queryWhere: ValueTypes['inscription_market_bool_exp'] | undefined = {}

    if (where.collectionId) {
      queryWhere.inscription = Object.assign(queryWhere.inscription || {}, {
        collection_id: {
          _eq: where.collectionId,
        },
      })
    } else if (where.onlySingle) {
      queryWhere.inscription = Object.assign(queryWhere.inscription || {}, {
        collection_id: {
          _is_null: true,
        },
      })
    }

    let variables: Record<string, unknown> | undefined
    if (where.traitFilters && where.traitFilters.length > 0) {
      variables = {}
      const metadataWhere = []

      for (const traitFilter of where.traitFilters) {
        let i = 0
        const traitWhere = []
        for (const valueFilter of traitFilter) {
          const variableName = `${valueFilter.trait_type.replace(/\W+/g, '')}${i}`
          variables[variableName] = {
            metadata: {
              attributes: [valueFilter],
            },
          }
          traitWhere.push({
            metadata: {
              _contains: $(variableName, 'jsonb'),
            },
          })
          i += 1
        }
        metadataWhere.push({ _or: traitWhere })
      }

      queryWhere.inscription = Object.assign(queryWhere.inscription || {}, {
        _and: metadataWhere,
      })
    }

    if (where.currentOwner) {
      queryWhere._or = [
        {
          inscription: {
            current_owner: {
              _eq: where.currentOwner,
            },
          },
        },
        {
          marketplace_listing: {
            seller_address: {
              _eq: where.currentOwner,
            },
          },
        },
      ]
    }

    if (where.search) {
      const searchResult = await this.query({
        find_inscription_by_name: [
          {
            args: {
              query_name: '%' + where.search + '%',
            },
          },
          {
            id: true,
          },
        ],
      })
      queryWhere.id = {
        _in: searchResult.find_inscription_by_name.map((i) => i.id as number),
      }
    }

    if (where.onlyBuy) {
      queryWhere.marketplace_listing = Object.assign(
        queryWhere.marketplace_listing || {},
        {
          is_cancelled: {
            _eq: false,
          },
          is_filled: {
            _eq: false,
          },
        },
      )
    }

    if (where.inscriptionNumberLTE) {
      queryWhere.inscription = Object.assign(queryWhere.inscription || {}, {
        inscription_number: {
          _lte: where.inscriptionNumberLTE,
        },
      })
    }

    if (where.priceGTE || where.priceLTE) {
      queryWhere.marketplace_listing = Object.assign(
        queryWhere.marketplace_listing || {},
        {
          total: {
            _lte: where.priceLTE,
            _gte: where.priceGTE,
          },
        },
      )
    }

    const result = await this.query(
      {
        inscription_market_aggregate: [
          { where: queryWhere },
          aggregateCountSelector,
        ],
        inscription_market: [
          {
            offset,
            limit,
            order_by: orderBy ? [orderBy] : undefined,
            where: queryWhere,
          },
          {
            inscription: {
              ...inscriptionSelector,
            },
            marketplace_listing: {
              ...marketplaceListingSelector,
            },
          },
        ],
      },
      {
        variables,
      },
    )
    return {
      inscriptions: result.inscription_market.map((i) => ({
        ...i.inscription!,
        marketplace_listing: i.marketplace_listing,
      })),
      count:
        result.inscription_market_aggregate.aggregate?.count ??
        result.inscription_market.length,
    } as InscriptionsResult
  }

  async getInscriptionHistory(
    inscriptionId: number,
    offset = 0,
    limit = 50,
    orderBy?: ValueTypes['inscription_history_order_by'],
  ): Promise<InscriptionHistory[]> {
    if (!orderBy) {
      orderBy = {
        height: order_by.desc,
      }
    }

    const result = await this.query({
      inscription_history: [
        {
          where: {
            inscription: {
              id: {
                _eq: inscriptionId,
              },
            },
          },
          order_by: [orderBy],
          offset,
          limit,
        },
        inscriptionHistorySelector,
      ],
    })
    return result.inscription_history
  }

  async getTokenAddressHistory(
    tokenId: number,
    address: string,
    orderBy?: ValueTypes['token_address_history_order_by'],
  ): Promise<TokenAddressHistory[]> {
    if (!orderBy) {
      orderBy = {
        height: order_by.desc,
      }
    }

    const result = await this.query({
      token_address_history: [
        {
          where: {
            _or: [
              {
                sender: {
                  _eq: address,
                },
              },
              {
                receiver: {
                  _eq: address,
                },
              },
            ],
            token_id: {
              _eq: tokenId,
            },
          },
          order_by: [orderBy],
        },
        tokenAddressHistorySelector,
      ],
    })
    return result.token_address_history
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

  async getBridgeHistorySignature(txHash: string) {
    const result = await this.query({
      bridge_history: [
        {
          where: {
            transaction: {
              hash: {
                _eq: txHash,
              },
            },
          },
        },
        bridgeSignatureHistorySelector,
      ],
    })

    return result.bridge_history[0]
  }

  async getBridgeHistoryHash(
    txHash: string,
  ): Promise<BridgeHistory | undefined> {
    const result = await this.query({
      bridge_history: [
        {
          where: {
            transaction: {
              hash: {
                _eq: txHash,
              },
            },
          },
        },
        bridgeHistorySelector,
      ],
    })

    return result.bridge_history[0]
  }

  async getLatestSendBridgeHistory(
    address: string,
  ): Promise<BridgeHistory | undefined> {
    const result = await this.query({
      bridge_history: [
        {
          where: {
            sender: {
              _eq: address,
            },
            action: {
              _eq: 'send',
            },
          },
          order_by: [
            {
              height: order_by.desc,
            },
          ],
          limit: 1,
        },
        bridgeHistorySelector,
      ],
    })

    return result.bridge_history[0]
  }

  async getReceivedBridgeHistory(
    height: number,
    receiver: string,
    tokenId: number,
    amount: number,
  ) {
    const result = await this.query({
      bridge_history: [
        {
          where: {
            height: {
              _gt: height,
            },
            receiver: {
              _eq: receiver,
            },
            token_id: {
              _eq: tokenId,
            },
            amount: {
              _eq: amount,
            },
          },
        },
        {
          amount: true,
        },
      ],
    })

    return result.bridge_history[0]
  }

  async getBridgeTokenSignature(ticker: string) {
    const result = await this.query({
      bridge_token: [
        {
          where: {
            token: {
              ticker: {
                _eq: ticker,
              },
            },
          },
        },
        bridgeTokenSignatureSelector,
      ],
    })

    return result.bridge_token[0]
  }

  async getBridgeTokens(): Promise<Token[]> {
    const result = await this.query({
      bridge_token: [
        {
          where: {
            enabled: {
              _eq: true,
            },
          },
        },
        {
          token: tokenSelector,
        },
      ],
    })

    return result.bridge_token.map((t) => t.token)
  }

  async findBridgeTokens(search: string): Promise<TokenWithBridge[]> {
    const result = await this.query({
      token: [
        {
          where: {
            _or: [
              { name: { _ilike: `%${search}%` } },
              { ticker: { _ilike: `%${search}%` } },
            ],
          },
        },
        tokenWithBridgeSelector,
      ],
    })
    return result.token
  }

  async getInscriptionTradeHistory(
    offset = 0,
    limit = 200,
    collectionId?: number,
  ): Promise<InscriptionTradeHistory[]> {
    const where: ValueTypes['inscription_trade_history_bool_exp'] = {}
    if (collectionId) {
      where.inscription = {
        collection_id: {
          _eq: collectionId,
        },
      }
    }

    const result = await this.query({
      inscription_trade_history: [
        {
          where,
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
    })
    return result.inscription_trade_history as InscriptionTradeHistory[]
  }

  async getTokenTradeHistory(
    tokenId?: number,
    offset = 0,
    limit = 100,
  ): Promise<TokenTradeHistory[]> {
    const where: ValueTypes['token_trade_history_bool_exp'] = {}
    if (tokenId) {
      where.token_id = {
        _eq: tokenId,
      }
    }

    const result = await this.query({
      token_trade_history: [
        {
          where,
          offset,
          limit,
          order_by: [
            {
              date_created: order_by.desc,
            },
          ],
        },
        tokenTradeHistorySelector,
      ],
    })
    return result.token_trade_history
  }

  async getTradeHistory(
    seller: string,
    offset = 0,
    limit = 100,
    orderBy?: ValueTypes['trade_history_order_by'],
  ): Promise<TradeHistoryResult> {
    if (!orderBy) {
      orderBy = { date_created: order_by.desc }
    }

    const where: ValueTypes['trade_history_bool_exp'] = {
      seller_address: {
        _eq: seller,
      },
    }

    const result = await this.query({
      trade_history: [
        {
          where,
          offset,
          limit,
          order_by: [orderBy],
        },
        tradeHistorySelector,
      ],
      trade_history_aggregate: [
        {
          where,
        },
        aggregateCountSelector,
      ],
    })

    return {
      history: result.trade_history as TradeHistory[],
      count:
        result.trade_history_aggregate.aggregate?.count ??
        result.trade_history.length,
    }
  }

  async getBridgeHistory(
    address: string,
    offset = 0,
    limit = 100,
    orderBy?: ValueTypes['bridge_history_order_by'],
  ): Promise<BridgeHistoryResult> {
    if (!orderBy) {
      orderBy = { date_created: order_by.desc }
    }

    const where: ValueTypes['bridge_history_bool_exp'] = {
      _or: [
        {
          sender: {
            _eq: address,
          },
        },
        {
          receiver: {
            _eq: address,
          },
        },
      ],
    }

    const result = await this.query({
      bridge_history: [
        {
          where,
          offset,
          limit,
          order_by: [orderBy],
        },
        bridgeHistorySelector,
      ],
      bridge_history_aggregate: [
        {
          where,
        },
        aggregateCountSelector,
      ],
    })

    return {
      history: result.bridge_history as BridgeHistory[],
      count:
        result.bridge_history_aggregate.aggregate?.count ??
        result.bridge_history.length,
    }
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

  async getActiveLaunches(): Promise<LaunchpadItem[]> {
    const result = await this.query({
      launchpad: [
        {
          order_by: [
            {
              date_created: order_by.desc,
            },
          ],
          where: {
            _or: [
              {
                finish_date: {
                  _gt: new Date(),
                },
              },
              {
                finish_date: {
                  _is_null: true,
                },
              },
            ],
          },
        },
        launchpadItemSelector,
      ],
    })

    return result.launchpad
  }

  async getCreatorLaunches(creator: string): Promise<CreatorLaunch[]> {
    const result = await this.query({
      launchpad: [
        {
          order_by: [
            {
              date_created: order_by.desc,
            },
          ],
          where: {
            collection: {
              creator: {
                _eq: creator,
              },
            },
          },
        },
        creatorLaunchSelector,
      ],
    })

    return result.launchpad
  }

  async getPastLaunches(): Promise<LaunchpadItem[]> {
    const result = await this.query({
      minted_out_launches: [
        {
          order_by: [
            {
              date_created: order_by.desc,
            },
          ],
        },
        launchpadItemSelector,
      ],
    })

    return result.minted_out_launches as LaunchpadItem[]
  }

  async getLaunchpadHash(symbol: string): Promise<string | undefined> {
    const result = await this.query({
      launchpad: [
        {
          where: {
            collection: {
              symbol: {
                _eq: symbol,
              },
            },
          },
        },
        {
          transaction: transactionHashSelector,
        },
      ],
    })

    return result.launchpad?.[0].transaction.hash
  }

  async getLaunchpad(symbol: string): Promise<Launchpad | undefined> {
    const result = await this.query({
      launchpad: [
        {
          where: {
            collection: {
              symbol: {
                _eq: symbol,
              },
            },
          },
        },
        launchpadSelector,
      ],
    })

    return result.launchpad[0]
  }

  async getLaunch(
    symbol: string,
    address?: string,
  ): Promise<LaunchpadDetail | undefined> {
    const result = await this.query({
      launchpad: [
        {
          where: {
            collection: {
              symbol: {
                _eq: symbol,
              },
            },
          },
        },
        {
          ...launchpadDetailSelector,
          stages: [
            {},
            {
              ...stageDetailSelector,
              whitelists: [
                {
                  where: {
                    address: address ? { _eq: address } : { _is_null: true },
                  },
                },
                { address: true },
              ],
              reservations_aggregate: [
                {
                  where: {
                    address: address ? { _eq: address } : { _is_null: true },
                  },
                },
                {
                  aggregate: {
                    count: [{}, true],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    return result.launchpad[0] as LaunchpadDetail | undefined
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

  // inscriptionTradeHistorySubscription(offset = 0, limit = 200) {
  //   return this.ws<'subscription', ScalarDefinition>('subscription')({
  //     inscription_trade_history: [
  //       {
  //         offset,
  //         limit,
  //         order_by: [
  //           {
  //             date_created: order_by.desc,
  //           },
  //         ],
  //       },
  //       inscriptionTradeHistorySelector,
  //     ],
  //   })
  // }
}
