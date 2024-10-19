import {
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
} from '@asteroid-protocol/sdk/client'
import { transactionHashSelector } from './transaction'

export const inscriptionSelector = Selector('inscription')({
  id: true,
  inscription_number: true,
  transaction: transactionHashSelector,
  current_owner: true,
  creator: true,
  height: true,
  content_path: true,
  content_size_bytes: true,
  date_created: true,
  is_explicit: true,
  __alias: {
    name: {
      metadata: [
        {
          path: '$.metadata.name',
        },
        true,
      ],
    },
    description: {
      metadata: [
        {
          path: '$.metadata.description',
        },
        true,
      ],
    },
    mime: {
      metadata: [
        {
          path: '$.metadata.mime',
        },
        true,
      ],
    },
  },
})

export type Inscription = Omit<
  InputType<
    GraphQLTypes['inscription'],
    typeof inscriptionSelector,
    ScalarDefinition
  >,
  'name' | 'description' | 'mime'
> & { name: string; description: string; mime: string }
