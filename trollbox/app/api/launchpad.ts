import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'

const collectionSelector = Selector('collection')({
  symbol: true,
  name: true,
  content_path: true,
  is_explicit: true,
  __alias: {
    description: {
      metadata: [
        {
          path: '$.metadata.description',
        },
        true,
      ],
    },
  },
})

type Collection = Omit<
  InputType<
    GraphQLTypes['collection'],
    typeof collectionSelector,
    ScalarDefinition
  >,
  'description'
> & { description: string }

export const mintReservationSelector = Selector('launchpad_mint_reservation')({
  id: true,
  launchpad: {
    collection: collectionSelector,
  },
})

export type MintReservation = Omit<
  InputType<
    GraphQLTypes['launchpad_mint_reservation'],
    typeof mintReservationSelector,
    ScalarDefinition
  >,
  'launchpad'
> & { launchpad: { collection: Collection } }
