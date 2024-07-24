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
      transaction: {
        hash: true,
      },
      creator: true,
    },
    reveal_immediately: true,
    reveal_date: true,
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

  async getLaunchpadMintReservations(): Promise<LaunchpadMintReservation[]> {
    const result = await this.query({
      launchpad_mint_reservation: [
        {
          where: {
            is_minted: {
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
