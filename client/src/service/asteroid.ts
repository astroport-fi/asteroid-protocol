import { Chain } from '../helpers/zeus.js'

export default class AsteroidService {
  chain: Chain

  constructor(url: string) {
    this.chain = Chain(url)
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
