import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { tokenSelector } from './token'

export const bridgeSignatureHistorySelector = Selector('bridge_history')({
  signature: true,
})

export const bridgeHistorySelector = Selector('bridge_history')({
  amount: true,
  receiver: true,
  transaction: {
    hash: true,
  },
  action: true,
  height: true,
  sender: true,
  date_created: true,
  token: {
    ticker: true,
    decimals: true,
    last_price_base: true,
  },
})

export type BridgeHistory = InputType<
  GraphQLTypes['bridge_history'],
  typeof bridgeHistorySelector,
  ScalarDefinition
>

export const bridgeTokenSignatureSelector = Selector('bridge_token')({
  signature: true,
})

export const tokenWithBridgeSelector = Selector('token')({
  bridge_tokens: [{}, { id: true }],
  ...tokenSelector,
})

export type TokenWithBridge = InputType<
  GraphQLTypes['token'],
  typeof tokenWithBridgeSelector,
  ScalarDefinition
>
