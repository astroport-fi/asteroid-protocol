import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { MarketplaceListing, marketplaceListingSelector } from './marketplace'

export const inscriptionSelector = Selector('inscription')({
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
    // @todo collections
    // attributes: {
    //   metadata: [
    //     {
    //       path: '$.metadata.attributes',
    //     },
    //     true,
    //   ],
    // },
  },
})

export type Inscription = InputType<
  GraphQLTypes['inscription'],
  typeof inscriptionSelector,
  ScalarDefinition
>

// Inscription image
export const inscriptionImageSelector = Selector('inscription')({
  transaction: {
    hash: true,
  },
  is_explicit: true,
  content_path: true,
  __alias: {
    mime: {
      metadata: [
        {
          path: '$.metadata.mime',
        },
        true,
      ],
    },
  },
})

export type InscriptionImage = InputType<
  GraphQLTypes['inscription'],
  typeof inscriptionImageSelector,
  ScalarDefinition
>

// Inscription listing
export const inscriptionListingSelector = Selector(
  'marketplace_inscription_detail',
)({
  marketplace_listing: marketplaceListingSelector,
})

export type InscriptionMarketplaceListing = InputType<
  GraphQLTypes['marketplace_inscription_detail'],
  typeof inscriptionListingSelector,
  ScalarDefinition
>

export type InscriptionWithMarket = Inscription & {
  marketplace_listing?: MarketplaceListing | undefined
}

// Inscription trade history
export const inscriptionTradeHistorySelector = Selector(
  'inscription_trade_history',
)({
  id: true,
  amount_quote: true,
  total_usd: true,
  seller_address: true,
  buyer_address: true,
  date_created: true,
  inscription: inscriptionImageSelector,
})

export type InscriptionTradeHistory = InputType<
  GraphQLTypes['inscription_trade_history'],
  typeof inscriptionTradeHistorySelector,
  ScalarDefinition
>

export const inscriptionHistorySelector = Selector('inscription_history')({
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
