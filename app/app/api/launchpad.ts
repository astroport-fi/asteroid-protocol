import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import {
  CollectionDetail,
  collectionDetailSelector,
  collectionSelector,
} from './collection'
import { transactionHashSelector } from './transaction'

export const stageSelector = Selector('launchpad_stage')({
  price: true,
})

export type Stage = InputType<
  GraphQLTypes['launchpad_stage'],
  typeof stageSelector,
  ScalarDefinition
>

export const stageDetailSelector = Selector('launchpad_stage')({
  id: true,
  name: true,
  description: true,
  start_date: true,
  finish_date: true,
  price: true,
  per_user_limit: true,
  has_whitelist: true,
  whitelists: [
    {},
    {
      address: true,
    },
  ],
  reservations_aggregate: [
    {},
    {
      aggregate: {
        count: [{}, true],
      },
    },
  ],
})

export type StageDetail = InputType<
  GraphQLTypes['launchpad_stage'],
  typeof stageDetailSelector,
  ScalarDefinition
>

export const launchpadSelector = Selector('launchpad')({
  transaction: transactionHashSelector,
  max_supply: true,
  minted_supply: true,
  start_date: true,
  finish_date: true,
  stages: [{}, stageSelector],
  collection: collectionSelector,
})

export type Launchpad = InputType<
  GraphQLTypes['launchpad'],
  typeof launchpadSelector,
  ScalarDefinition
>

export const launchpadDetailSelector = Selector('launchpad')({
  max_supply: true,
  minted_supply: true,
  start_date: true,
  finish_date: true,
  transaction: {
    hash: true,
  },
  stages: [{}, stageDetailSelector],
  collection: collectionDetailSelector,
})

export type LaunchpadDetail = Omit<
  InputType<
    GraphQLTypes['launchpad'],
    typeof launchpadDetailSelector,
    ScalarDefinition
  >,
  'collection'
> & { collection: CollectionDetail }

export const creatorLaunchSelector = Selector('launchpad')({
  transaction: {
    hash: true,
  },
  max_supply: true,
  collection: {
    symbol: true,
    name: true,
    content_path: true,
    is_explicit: true,
  },
})

export type CreatorLaunch = InputType<
  GraphQLTypes['launchpad'],
  typeof creatorLaunchSelector,
  ScalarDefinition
>

export const mintReservationSelector = Selector('launchpad_mint_reservation')({
  id: true,
  launchpad: {
    collection: {
      symbol: true,
      name: true,
      content_path: true,
      is_explicit: true,
    },
  },
})

export type MintReservation = InputType<
  GraphQLTypes['launchpad_mint_reservation'],
  typeof mintReservationSelector,
  ScalarDefinition
>
