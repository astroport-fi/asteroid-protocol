import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { Aggregate } from './common'
import { marketplaceListingSelector } from './marketplace'

export const tokenSelector = Selector('token')({
  id: true,
  name: true,
  ticker: true,
  decimals: true,
  launch_timestamp: true,
  content_path: true,
  circulating_supply: true,
  last_price_base: true,
  volume_24_base: true,
  date_created: true,
  max_supply: true,
})

export type Token = InputType<
  GraphQLTypes['token'],
  typeof tokenSelector,
  ScalarDefinition
>

export const tokenDetailSelector = Selector('token')({
  id: true,
  height: true,
  transaction: {
    hash: true,
  },
  creator: true,
  current_owner: true,
  name: true,
  ticker: true,
  decimals: true,
  max_supply: true,
  per_mint_limit: true,
  launch_timestamp: true,
  last_price_base: true,
  volume_24_base: true,
  content_path: true,
  content_size_bytes: true,
  circulating_supply: true,
  date_created: true,
})

export type TokenDetail = InputType<
  GraphQLTypes['token'],
  typeof tokenDetailSelector,
  ScalarDefinition
>

export function isTokenLaunched(token: Pick<Token, 'launch_timestamp'>) {
  const now = new Date().getTime() / 1000
  return now > token.launch_timestamp
}

export type TokenTypeWithHolder<T> = T & {
  token_holders?: (TokenHolderAmount | undefined)[]
}

export type TokenType<T> = T extends true
  ? TokenTypeWithHolder<TokenDetail>
  : TokenTypeWithHolder<Token>

// Token holder
export const tokenHolderSelector = Selector('token_holder')({
  id: true,
  address: true,
  amount: true,
  date_updated: true,
})

export type TokenHolder = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenHolderSelector,
  ScalarDefinition
>

export const tokenHolderAmountSelector = Selector('token_holder')({
  amount: true,
})

export type TokenHolderAmount = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenHolderAmountSelector,
  ScalarDefinition
>

// Token holding
export const tokenHoldingSelector = Selector('token_holder')({
  token: tokenSelector,
  amount: true,
  date_updated: true,
})

export type TokenHolding = InputType<
  GraphQLTypes['token_holder'],
  typeof tokenHoldingSelector,
  ScalarDefinition
>

// Token address history
export const tokenAddressHistorySelector = Selector('token_address_history')({
  id: true,
  height: true,
  transaction: {
    hash: true,
  },
  action: true,
  amount: true,
  sender: true,
  receiver: true,
  date_created: true,
})

export type TokenAddressHistory = InputType<
  GraphQLTypes['token_address_history'],
  typeof tokenAddressHistorySelector,
  ScalarDefinition
>

// Token listing
export const tokenListingSelector = Selector('marketplace_cft20_detail')({
  id: true,
  marketplace_listing: marketplaceListingSelector,
  ppt: true,
  amount: true,
  date_created: true,
})

export type MarketplaceTokenListing = InputType<
  GraphQLTypes['marketplace_cft20_detail'],
  typeof tokenListingSelector,
  ScalarDefinition
>

// Token market
export const tokenMarketTokenSelector = Selector('token')({
  id: true,
  name: true,
  ticker: true,
  decimals: true,
  content_path: true,
  circulating_supply: true,
  last_price_base: true,
  volume_24_base: true,
  max_supply: true,
  launch_timestamp: true,
})

export type TokenMarketToken = InputType<
  GraphQLTypes['token'],
  typeof tokenMarketTokenSelector,
  ScalarDefinition
>

export type TokenMarket = TokenMarketToken & {
  marketplace_cft20_details_aggregate: Aggregate
  token_holders: (TokenHolderAmount | undefined)[]
}
