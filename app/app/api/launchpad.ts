import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { collectionSelector } from './collection'

export const stageSelector = Selector('launchpad_stage')({
  name: true,
  description: true,
  start_date: true,
  finish_date: true,
  price: true,
  per_user_limit: true,
})

export type Stage = InputType<
  GraphQLTypes['launchpad_stage'],
  typeof stageSelector,
  ScalarDefinition
>

export const launchpadSelector = Selector('launchpad')({
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
