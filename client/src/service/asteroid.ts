import { Chain, Subscription } from '../helpers/zeus.js'

export class AsteroidService {
  chain: Chain
  subscription?: Subscription

  constructor(url: string, wsEnabled = false) {
    this.chain = Chain(url)
    if (wsEnabled) {
      this.subscription = Subscription(url)
    }
  }

  async fetchListing(listingHash: string) {
    const res = await this.chain('query')({
      marketplace_listing: [
        {
          where: {
            transaction: {
              hash: {
                _eq: listingHash,
              },
            },
          },
        },
        {
          seller_address: true,
          total: true,
          deposit_total: true,
          is_deposited: true,
          is_cancelled: true,
          is_filled: true,
        },
      ],
    })
    return res.marketplace_listing[0]
  }
}
