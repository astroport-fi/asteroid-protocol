import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import type { Optional } from '~/utils/types'
import { inscriptionImageSelector } from './inscription'

export const tradeHistorySelector = Selector('trade_history')({
  id: true,
  amount_quote: true,
  amount_base: true,
  total_usd: true,
  seller_address: true,
  buyer_address: true,
  date_created: true,
  token: {
    ticker: true,
  },
  inscription: inscriptionImageSelector,
})

export type TradeHistory = Optional<
  InputType<
    GraphQLTypes['trade_history'],
    typeof tradeHistorySelector,
    ScalarDefinition
  >,
  'token' | 'inscription'
>
