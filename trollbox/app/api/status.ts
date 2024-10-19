import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'

export const statusSelector = Selector('status')({
  base_token: true,
  base_token_usd: true,
  last_processed_height: true,
  last_known_height: true,
})

export type Status = InputType<
  GraphQLTypes['status'],
  typeof statusSelector,
  ScalarDefinition
>
