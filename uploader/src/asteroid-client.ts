import {
  AsteroidService,
  GraphQLTypes,
  InputType,
  ScalarDefinition,
  Selector,
  order_by,
} from '@asteroid-protocol/sdk/client'

export const launchpadMintReservationSelector = Selector(
  'launchpad_mint_reservation',
)({
  address: true,
  __alias: {
    reservation_id: { token_id: true },
    token_id: {
      metadata: [
        {
          path: '$.token_id',
        },
        true,
      ],
    },
  },
  is_random: true,
  metadata: [{}, true],
  launchpad: {
    transaction: {
      hash: true,
    },
    collection: {
      id: true,
      symbol: true,
      name: true,
      transaction: {
        hash: true,
      },
      creator: true,
    },
    reveal_immediately: true,
    reveal_date: true,
    max_supply: true,
    minted_supply: true,
  },
  stage: {
    price: true,
    price_curve: true,
  },
})

export type LaunchpadMintReservation = Omit<
  InputType<
    GraphQLTypes['launchpad_mint_reservation'],
    typeof launchpadMintReservationSelector,
    ScalarDefinition
  >,
  'token_id'
> & { token_id: number | null }

const trollPostSelector = Selector('troll_post')({
  id: true,
  text: true,
  content_path: true,
})

export type TrollPost = InputType<
  GraphQLTypes['troll_post'],
  typeof trollPostSelector,
  ScalarDefinition
>

export class AsteroidClient extends AsteroidService {
  constructor(url: string) {
    super(url)
  }

  async getCollectionSupply(launchHash: string): Promise<number | undefined> {
    const result = await this.query({
      launchpad: [
        {
          where: {
            transaction: {
              hash: {
                _eq: launchHash,
              },
            },
          },
        },
        {
          max_supply: true,
        },
      ],
    })

    return result.launchpad?.[0].max_supply
  }

  async checkIfMinted(collectionId: number, tokenId: number): Promise<boolean> {
    const result = await this.query({
      inscription: [
        {
          where: {
            collection_id: {
              _eq: collectionId,
            },
            token_id: {
              _eq: tokenId,
            },
          },
        },
        {
          token_id: true,
        },
      ],
    })

    return result.inscription.length > 0
  }

  async getLaunchpadMintReservations(): Promise<LaunchpadMintReservation[]> {
    const result = await this.query({
      launchpad_mint_reservation: [
        {
          where: {
            is_minted: {
              _eq: false,
            },
            is_expired: {
              _eq: false,
            },
          },
          order_by: [
            {
              id: order_by.asc,
            },
          ],
        },
        launchpadMintReservationSelector,
      ],
    })

    return result.launchpad_mint_reservation as LaunchpadMintReservation[]
  }

  async getTrollPost(transactionHash: string): Promise<TrollPost | undefined> {
    const result = await this.query({
      troll_post: [
        {
          where: {
            transaction: {
              hash: {
                _eq: transactionHash,
              },
            },
          },
        },
        trollPostSelector,
      ],
    })

    return result.troll_post?.[0]
  }
}
