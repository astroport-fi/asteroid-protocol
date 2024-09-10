import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { transactionHashSelector } from './transaction'

export const collectionSelector = Selector('collection')({
  id: true,
  transaction: transactionHashSelector,
  symbol: true,
  name: true,
  creator: true,
  content_path: true,
  date_created: true,
  is_explicit: true,
  royalty_percentage: true,
})

export type Collection = InputType<
  GraphQLTypes['collection'],
  typeof collectionSelector,
  ScalarDefinition
>

export const collectionTraitSelector = Selector('collection_traits')({
  count: true,
  trait_type: [{}, true],
  trait_value: [{}, true],
})

export interface CollectionTrait {
  count: number
  trait_type: string
  trait_value: string
}

// Collection detail
export const collectionDetailSelector = Selector('collection')({
  ...collectionSelector,
  traits: [{}, collectionTraitSelector],
  metadata: [{ path: '$.metadata' }, true],
})

export type CollectionDetail = Omit<
  InputType<
    GraphQLTypes['collection'],
    typeof collectionDetailSelector,
    ScalarDefinition
  >,
  'traits' | 'metadata'
> & { traits: CollectionTrait[]; metadata: inscription.CollectionMetadata }

// Top collection
export const topCollectionSelector = Selector('top_collection')({
  id: true,
  content_path: true,
  name: true,
  symbol: true,
})

export type TopCollection = InputType<
  GraphQLTypes['top_collection'],
  typeof topCollectionSelector,
  ScalarDefinition
>

// Collection stats

export const collectionStatsSelector = Selector('collection_stats')({
  floor_price: true,
  listed: true,
  owners: true,
  supply: true,
  volume: true,
  volume_24h: true,
})

export type CollectionStats = InputType<
  GraphQLTypes['collection_stats'],
  typeof collectionStatsSelector,
  ScalarDefinition
>

export const collectionStatsItemSelector = Selector('collection_stats')({
  floor_price: true,
  floor_price_1d_change: true,
  floor_price_1w_change: true,
  listed: true,
  owners: true,
  supply: true,
  volume_24h: true,
  volume_7d: true,
  collection: topCollectionSelector,
})

export type CollectionsStatsItem = InputType<
  GraphQLTypes['collection_stats'],
  typeof collectionStatsItemSelector,
  ScalarDefinition
> & {
  collection: TopCollection
}
