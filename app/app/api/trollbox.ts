import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { transactionHashSelector } from './transaction'

export const trollPostSelector = Selector('troll_post')({
  id: true,
  transaction: transactionHashSelector,
  text: true,
  creator: true,
  content_path: true,
  date_created: true,
  is_explicit: true,
})

export type TrollPost = InputType<
  GraphQLTypes['troll_post'],
  typeof trollPostSelector,
  ScalarDefinition
>
