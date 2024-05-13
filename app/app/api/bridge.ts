import { Selector } from '@asteroid-protocol/sdk/client'

export const bridgeHistorySelector = Selector('bridge_history')({
  signature: true,
})

export const bridgeTokenSignatureSelector = Selector('bridge_token')({
  signature: true,
})
