import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'

export const transactionHashSelector = Selector('transaction')({
  hash: true,
})

export type TransactionHash = InputType<
  GraphQLTypes['transaction'],
  typeof transactionHashSelector,
  ScalarDefinition
>
