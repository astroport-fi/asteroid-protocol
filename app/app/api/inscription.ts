import { CollectionMetadata } from '@asteroid-protocol/sdk'
import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { TraitItem } from './client'
import { MarketplaceListing, marketplaceListingSelector } from './marketplace'

export const inscriptionSelector = Selector('inscription')({
  id: true,
  inscription_number: true,
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
  },
})

export type Inscription = Omit<
  InputType<
    GraphQLTypes['inscription'],
    typeof inscriptionSelector,
    ScalarDefinition
  >,
  'name' | 'description' | 'mime'
> & { name: string; description: string; mime: string }

const inscriptionDetailCollectionSelector = Selector('collection')({
  symbol: true,
  name: true,
  stats: {
    supply: true,
  },
  metadata: [{ path: '$.metadata' }, true],
})

export type InscriptionDetailCollection = Omit<
  InputType<
    GraphQLTypes['collection'],
    typeof inscriptionDetailCollectionSelector,
    ScalarDefinition
  >,
  'metadata'
> & { metadata: CollectionMetadata }

// Inscription detail
export const inscriptionDetailSelector = Selector('inscription')({
  ...inscriptionSelector,
  version: true,
  collection: inscriptionDetailCollectionSelector,
  rarity: {
    rarity_rank: true,
  },
  migration_permission_grants: [{}, { grantee: true }],
  __alias: {
    ...inscriptionSelector.__alias,
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

export type InscriptionDetail = Omit<
  InputType<
    GraphQLTypes['inscription'],
    typeof inscriptionDetailSelector,
    ScalarDefinition
  >,
  'name' | 'description' | 'mime' | 'attributes' | 'collection'
> & {
  name: string
  description: string
  mime: string
  attributes?: TraitItem[]
  migration_permission_grants?: { grantee: string }[]
  collection?: InscriptionDetailCollection
}

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
    // @todo
    name: {
      metadata: [
        {
          path: '$.metadata.name',
        },
        true,
      ],
    },
  },
})

export type InscriptionType<T> = T extends true
  ? InscriptionDetail
  : Inscription

export type InscriptionImage = Omit<
  InputType<
    GraphQLTypes['inscription'],
    typeof inscriptionImageSelector,
    ScalarDefinition
  >,
  'mime'
> & { mime: string; name: string }

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

export type InscriptionWithMarket<T extends Inscription = Inscription> = T & {
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

export type InscriptionTradeHistory = Omit<
  InputType<
    GraphQLTypes['inscription_trade_history'],
    typeof inscriptionTradeHistorySelector,
    ScalarDefinition
  >,
  'inscription'
> & { inscription: InscriptionImage }

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
