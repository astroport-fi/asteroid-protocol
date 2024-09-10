import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { getDateFromUTCString } from '~/utils/date'
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
  reveal_date: true,
  reveal_immediately: true,
  transaction: transactionHashSelector,
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
  transaction: transactionHashSelector,
  max_supply: true,
  start_date: true,
  collection: {
    symbol: true,
    name: true,
    content_path: true,
    is_explicit: true,
    transaction: transactionHashSelector,
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

function isStageActive(stage: StageDetail) {
  const now = new Date()
  return (
    (!stage.start_date || getDateFromUTCString(stage.start_date) < now) &&
    (!stage.finish_date || getDateFromUTCString(stage.finish_date) > now)
  )
}

export function getActiveStage(stages: StageDetail[]) {
  // sort by price cheapest first
  stages.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))

  for (const stage of stages) {
    if (isStageActive(stage)) {
      const isEligible =
        stage == null || !stage.has_whitelist || stage.whitelists[0] != null
      const userReservations =
        stage.reservations_aggregate.aggregate?.count ?? 0
      const reachedLimit =
        stage.per_user_limit && userReservations >= stage.per_user_limit
      if (isEligible && !reachedLimit) {
        return stage
      }
    }
  }

  // if no active stage for user found, return the last stage
  return [...stages].reverse().find(isStageActive)
}
