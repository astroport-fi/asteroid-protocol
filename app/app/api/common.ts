import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'

export const aggregateCountSelector = Selector('token_aggregate')({
  // token_aggregate doesn't matter here, could be any aggregate
  aggregate: {
    count: [{}, true],
  },
})

export type Aggregate = InputType<
  GraphQLTypes['token_aggregate'],
  typeof aggregateCountSelector,
  ScalarDefinition
>

export const collectionStatsSelector = Selector('collection_stats')({
  floor_price: true,
  listed: true,
  owners: true,
  supply: true,
  volume: true,
})

export type CollectionStats = InputType<
  GraphQLTypes['collection_stats'],
  typeof collectionStatsSelector,
  ScalarDefinition
>
