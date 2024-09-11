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
  token_id: true,
  launchpad: {
    transaction: {
      hash: true,
    },
    collection: {
      id: true,
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
  },
})

export type LaunchpadMintReservation = InputType<
  GraphQLTypes['launchpad_mint_reservation'],
  typeof launchpadMintReservationSelector,
  ScalarDefinition
>

export class AsteroidClient extends AsteroidService {
  constructor(url: string) {
    super(url)
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

    return result.launchpad_mint_reservation
  }
}
