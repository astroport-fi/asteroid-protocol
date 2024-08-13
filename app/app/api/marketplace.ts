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

export enum ListingState {
  Reserve,
  Buy,
  Cancel,
  Reserved,
}

export function getListingState(
  listing: Omit<MarketplaceListing, 'transaction'>,
  walletAddress: string | undefined,
  currentBlock: number,
) {
  const isExpired = listing.depositor_timedout_block! < currentBlock
  const isDeposited = listing.is_deposited

  if (listing.seller_address == walletAddress) {
    if (!isDeposited || isExpired) {
      return ListingState.Cancel
    } else {
      return ListingState.Reserved
    }
  } else {
    if (isDeposited && !isExpired) {
      if (listing.depositor_address == walletAddress) {
        return ListingState.Buy
      } else {
        return ListingState.Reserved
      }
    }
  }

  return ListingState.Reserve
}

export const oldMarketplaceListingSelector = Selector('token_open_position')({
  id: true,
  amount: true,
  ppt: true,
  date_created: true,
  total: true,
  transaction: transactionHashSelector,
  seller_address: true,
})

export type OldMarketplaceListing = InputType<
  GraphQLTypes['token_open_position'],
  typeof oldMarketplaceListingSelector,
  ScalarDefinition
>
