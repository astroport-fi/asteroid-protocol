import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { transactionHashSelector } from './transaction'

export const marketplaceListingSelector = Selector('marketplace_listing')({
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
  typeof marketplaceListingSelector,
  ScalarDefinition
>
