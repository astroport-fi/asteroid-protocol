import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { tokenSelector } from './token'

export const bridgeHistorySelector = Selector('bridge_history')({
  signature: true,
})

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
