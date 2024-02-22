import {
  AsteroidService as BaseAsteroidService,
  GraphQLTypes,
  InputType,
  QueryOptions,
  ScalarDefinition,
  Selector,
  ValueTypes,
  WSSubscription,
  order_by,
} from '@asteroid-protocol/sdk'

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
  max_supply: true,
})

export type Token = InputType<
  GraphQLTypes['token'],
  typeof tokenSelector,
  ScalarDefinition
>

const tokenDetailSelector = Selector('token')({
  id: true,
  height: true,
  transaction: {
    hash: true,
  },
  creator: true,
  current_owner: true,
  name: true,
  ticker: true,
  decimals: true,
  max_supply: true,
  per_mint_limit: true,
  launch_timestamp: true,
  last_price_base: true,
  content_path: true,
  content_size_bytes: true,
  circulating_supply: true,
  date_created: true,
})

export type TokenDetail = InputType<
  GraphQLTypes['token'],
  typeof tokenDetailSelector,
  ScalarDefinition
>

export type TokenType<T> = T extends true ? TokenDetail : Token

const tokenHoldingSelector = Selector('token_holder')({
  token: tokenSelector,
  amount: true,
  date_updated: true,
})

export type TokenHolding = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenHoldingSelector,
  ScalarDefinition
>

const tokenHolderSelector = Selector('token_holder')({
  id: true,
  address: true,
  amount: true,
  date_updated: true,
})

export type TokenHolder = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenHolderSelector,
  ScalarDefinition
>

const statusSelector = Selector('status')({
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

const aggregateCountSelector = Selector('marketplace_cft20_detail_aggregate')({
  aggregate: {
    count: [{}, true],
  },
})

const transactionHashSelector = Selector('transaction')({
  hash: true,
})

export type TransactionHash = InputType<
  GraphQLTypes['transaction'],
  typeof transactionHashSelector,
  ScalarDefinition
>

const marketplaceListingSelector = Selector('marketplace_listing')({
  seller_address: true,
  total: true,
  depositor_address: true,
  is_deposited: true,
  depositor_timedout_block: true,
  deposit_total: true,
  transaction: transactionHashSelector,
})

export type MarketplaceListing = InputType<
  GraphQLTypes['marketplace_listing'],
  typeof cft20ListingSelector,
  ScalarDefinition
>

const inscriptionListingSelector = Selector('marketplace_inscription_detail')({
  marketplace_listing: marketplaceListingSelector,
})

export type InscriptionMarketplaceListing = InputType<
  GraphQLTypes['marketplace_inscription_detail'],
  typeof inscriptionListingSelector,
  ScalarDefinition
>

const cft20ListingSelector = Selector('marketplace_cft20_detail')({
  id: true,
  marketplace_listing: marketplaceListingSelector,
  ppt: true,
  amount: true,
  date_created: true,
})

export type CFT20MarketplaceListing = InputType<
  GraphQLTypes['marketplace_cft20_detail'],
  typeof cft20ListingSelector,
  ScalarDefinition
>

// const collectionSelector = Selector('collection')({
//   id: true,
//   transaction: {
//     hash: true,
//   },
//   symbol: true,
//   creator: true,
//   content_path: true,
//   content_size_bytes: true,
//   date_created: true,
//   is_explicit: true,
//   __alias: {
//     name: {
//       metadata: [
//         {
//           path: '$.metadata.name',
//         },
//         true,
//       ],
//     },
//     description: {
//       metadata: [
//         {
//           path: '$.metadata.description',
//         },
//         true,
//       ],
//     },
//     mime: {
//       metadata: [
//         {
//           path: '$.metadata.mime',
//         },
//         true,
//       ],
//     },
//   },
// })

// export type Collection = InputType<
//   GraphQLTypes['collection'],
//   typeof collectionSelector,
//   ScalarDefinition
// >

//// TOKEN MARKET

const tokenMarketTokenSelector = Selector('token')({
  id: true,
  content_path: true,
  name: true,
  ticker: true,
  decimals: true,
  last_price_base: true,
  volume_24_base: true,
})

const tokenMarketHolderSelector = Selector('token_holder')({
  amount: true,
})

const marketplaceCft20DetailsAggregateSelector = Selector(
  'marketplace_cft20_detail_aggregate',
)({
  aggregate: {
    count: [{}, true],
  },
})

export type TokenMarketToken = InputType<
  GraphQLTypes['token'],
  typeof tokenMarketTokenSelector,
  ScalarDefinition
>

export type TokenMarketHolder = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenMarketHolderSelector,
  ScalarDefinition
>

export type MarketplaceCFT20DetailsAggregate = InputType<
  GraphQLTypes['marketplace_cft20_detail_aggregate'],
  typeof marketplaceCft20DetailsAggregateSelector,
  ScalarDefinition
>

export type TokenMarket = TokenMarketToken & {
  marketplace_cft20_details_aggregate: MarketplaceCFT20DetailsAggregate
  token_holders: (TokenMarketHolder | undefined)[]
}

//// INSCRIPTION

const inscriptionSelector = Selector('inscription')({
  id: true,
  transaction: {
    hash: true,
  },
  current_owner: true,
  creator: true,
  height: true,
  content_path: true,
  content_size_bytes: true,
  date_created: true,
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
    attributes: {
      metadata: [
        {
          path: '$.metadata.attributes',
        },
        true,
      ],
    },
  },
})

export type Inscription = InputType<
  GraphQLTypes['inscription'],
  typeof inscriptionSelector,
  ScalarDefinition
>

export type InscriptionWithMarket = Inscription & {
  marketplace_inscription_details: (InscriptionMarketplaceListing | undefined)[]
}

const inscriptionTradeHistorySelector = Selector('inscription_trade_history')({
  id: true,
  amount_quote: true,
  total_usd: true,
  seller_address: true,
  buyer_address: true,
  date_created: true,
  inscription: inscriptionSelector,
})

export type InscriptionTradeHistory = InputType<
  GraphQLTypes['inscription_trade_history'],
  typeof inscriptionTradeHistorySelector,
  ScalarDefinition
>

const inscriptionHistorySelector = Selector('inscription_history')({
  id: true,
  height: true,
  transaction: {
    hash: true,
  },
  sender: true,
  receiver: true,
  action: true,
  date_created: true,
})

export type InscriptionHistory = InputType<
  GraphQLTypes['inscription_history'],
  typeof inscriptionHistorySelector,
  ScalarDefinition
>

const tokenAddressHistorySelector = Selector('token_address_history')({
  id: true,
  height: true,
  transaction: {
    hash: true,
  },
  action: true,
  amount: true,
  sender: true,
  receiver: true,
  date_created: true,
})

export type TokenAddressHistory = InputType<
  GraphQLTypes['token_address_history'],
  typeof tokenAddressHistorySelector,
  ScalarDefinition
>

export type TokenListings = {
  listings: CFT20MarketplaceListing[]
  count?: number
}

export class AsteroidService extends BaseAsteroidService {
  constructor(url: string, wssUrl?: string) {
    super(url, wssUrl)
  }

  async getStatus(chainId: string): Promise<Status | undefined> {
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

  async getToken<T extends boolean = false>(
    ticker: string,
    detail = false as T,
  ): Promise<TokenType<T> | undefined> {
    const queryOptions: QueryOptions<'token'> = {
      where: {
        ticker: {
          _eq: ticker,
        },
      },
    }

    if (detail) {
      const result = await this.query({
        token: [queryOptions, tokenDetailSelector],
      })
      return result.token[0] as TokenType<T>
    }

    const result = await this.query({
      token: [queryOptions, tokenSelector],
    })
    return result.token[0] as TokenType<T>
  }

  async getTokens(
    offset: number,
    limit: number,
    where: {
      currentOwner?: string
    } = {},
    orderBy?: ValueTypes['token_order_by'],
  ): Promise<Token[]> {
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
    })
    return result.token
  }

  async getTokenHolders(
    tokenId: number,
    offset: number,
    limit: number,
    orderBy?: ValueTypes['token_holder_order_by'],
  ): Promise<TokenHolder[]> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.desc,
      }
    }

    const result = await this.query({
      token_holder: [
        {
          offset,
          limit,
          order_by: [orderBy],
          where: {
            token_id: {
              _eq: tokenId,
            },
            amount: {
              _gt: 0,
            },
          },
        },
        tokenHolderSelector,
      ],
    })
    return result.token_holder
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
        tokenHoldingSelector,
      ],
    })
    return result.token_holder[0]
  }

  async getTokenHoldings(
    address: string,
    offset = 0,
    limit = 500,
    search?: string | null,
    orderBy?: ValueTypes['token_holder_order_by'],
  ): Promise<TokenHolding[]> {
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
          { name: { _like: `%${search}%` } },
          { name: { _like: `%${search.toUpperCase()}%` } },
          { ticker: { _like: `%${search}%` } },
          { ticker: { _like: `%${search.toUpperCase()}%` } },
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
    })
    return holderResult.token_holder
  }

  async getTokenMarkets(
    offset: number = 0,
    limit: number = 20,
    where: {
      userAddress?: string
    } = {},
    orderBy?: ValueTypes['token_order_by'],
  ): Promise<TokenMarket[]> {
    if (!orderBy) {
      orderBy = {
        id: order_by.desc,
      }
    }

    let tokenHolders:
      | [QueryOptions<'token_holder'>, { amount: boolean }]
      | undefined
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

    const result = await this.query({
      token: [
        { offset, limit, order_by: [orderBy] },
        {
          id: true,
          content_path: true,
          name: true,
          ticker: true,
          decimals: true,
          last_price_base: true,
          volume_24_base: true,
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
    return result.token
  }

  async getTokenListings(
    tokenId: number,
    offset: number = 0,
    limit: number = 20,
    orderBy?: ValueTypes['marketplace_cft20_detail_order_by'],
    aggregate = false,
  ): Promise<TokenListings> {
    if (!orderBy) {
      orderBy = {
        amount: order_by.asc,
      }
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
    }

    type Query = {
      marketplace_cft20_detail: [
        QueryOptions<'marketplace_cft20_detail'>,
        typeof cft20ListingSelector,
      ]
      marketplace_cft20_detail_aggregate?: [
        QueryOptions<'marketplace_cft20_detail_aggregate'>,
        typeof aggregateCountSelector,
      ]
    }

    const query: Query = {
      marketplace_cft20_detail: [
        {
          where,
          offset,
          limit,
          order_by: [orderBy],
        },
        cft20ListingSelector,
      ],
    }

    if (aggregate) {
      query.marketplace_cft20_detail_aggregate = [
        {
          where,
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
  ): WSSubscription<{ marketplace_cft20_detail: CFT20MarketplaceListing[] }> {
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
        cft20ListingSelector,
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

  // async getCollections(
  //   offset: number,
  //   limit: number,
  //   where: {
  //     creator?: string
  //   } = {},
  //   orderBy?: ValueTypes['collection_order_by'],
  // ): Promise<Collection[]> {
  //   if (!orderBy) {
  //     orderBy = {
  //       date_created: order_by.desc,
  //     }
  //   }

  //   const queryWhere: ValueTypes['collection_bool_exp'] | undefined = {}
  //   if (where.creator) {
  //     queryWhere.creator = {
  //       _eq: where.creator,
  //     }
  //   }

  //   const result = await this.query({
  //     collection: [
  //       {
  //         offset,
  //         limit,
  //         where: queryWhere,
  //         order_by: [orderBy],
  //       },
  //       collectionSelector,
  //     ],
  //   })

  //   return result.collection
  // }

  // async getCollection(symbol: string): Promise<Collection | undefined> {
  //   const result = await this.query({
  //     collection: [
  //       {
  //         where: {
  //           symbol: {
  //             _eq: symbol,
  //           },
  //         },
  //       },
  //       collectionSelector,
  //     ],
  //   })
  //   return result.collection[0]
  // }

  async getInscription(hash: string): Promise<Inscription | undefined> {
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
        inscriptionSelector,
      ],
    })
    return result.inscription[0]
  }

  async getInscriptions(
    offset: number,
    limit: number,
    where: {
      collectionId?: number
      currentOwner?: string
      onlySingle?: boolean
    } = {},
    orderBy?: ValueTypes['inscription_order_by'],
  ): Promise<InscriptionWithMarket[]> {
    if (!orderBy) {
      orderBy = {
        // date_created: order_by.desc,
      }
    }

    const queryWhere: ValueTypes['inscription_market_bool_exp'] | undefined = {}

    // if (where.collectionId) {
    //   queryWhere.collection_id = {
    //     _eq: where.collectionId,
    //   }
    // } else if (where.onlySingle) {
    //   queryWhere.collection_id = {
    //     _is_null: true,
    //   }
    // }
    if (where.currentOwner) {
      queryWhere.inscription = {
        current_owner: {
          _eq: where.currentOwner,
        },
      }
    }

    const result = await this.query({
      inscription_market: [
        {
          offset,
          limit,
          // order_by: [orderBy],
          where: queryWhere,
        },
        {
          inscription: {
            ...inscriptionSelector,
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
        },
      ],
    })
    return result.inscription_market.map((i) => i.inscription!)
  }

  async getInscriptionHistory(
    inscriptionId: number,
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
    })
    return result.inscription_trade_history
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
    })
  }
}
