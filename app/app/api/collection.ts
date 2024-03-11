import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'

export const collectionSelector = Selector('collection')({
  id: true,
  transaction: {
    hash: true,
  },
  symbol: true,
  name: true,
  creator: true,
  content_path: true,
  date_created: true,
  is_explicit: true,
})

export type Collection = InputType<
  GraphQLTypes['collection'],
  typeof collectionSelector,
  ScalarDefinition
>

export const collectionTraitSelector = Selector('collection_traits')({
  count: true,
  trait_type: [{}, true],
  trait_value: [{}, true],
})

export type CollectionTrait = Required<
  InputType<
    GraphQLTypes['collection_traits'],
    typeof collectionTraitSelector,
    ScalarDefinition
  >
>

// Collection detail
export const collectionDetailSelector = Selector('collection')({
  ...collectionSelector,
  traits: [{}, collectionTraitSelector],
  metadata: [{ path: '$.metadata' }, true],
})

export type CollectionDetail = InputType<
  GraphQLTypes['collection'],
  typeof collectionDetailSelector,
  ScalarDefinition
>
