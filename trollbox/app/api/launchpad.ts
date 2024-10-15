import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'

export const mintReservationSelector = Selector('launchpad_mint_reservation')({
  id: true,
  launchpad: {
    collection: {
      symbol: true,
      name: true,
      content_path: true,
      is_explicit: true,
    },
  },
})

export type MintReservation = InputType<
  GraphQLTypes['launchpad_mint_reservation'],
  typeof mintReservationSelector,
  ScalarDefinition
>
