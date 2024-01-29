import MarketplaceProtocol from '../metaprotocol/marketplace.js'
import { OperationsBase } from './index.js'

export class MarketplaceOperations extends OperationsBase {
  protocol: MarketplaceProtocol
  address: string

  constructor(chainId: string, address: string) {
    super()
    this.protocol = new MarketplaceProtocol(chainId)
    this.address = address
  }

  listCFT20(
    ticker: string,
    amount: number,
    pricePerToken: number,
    minDepositPercent: number,
    timeoutBlocks: number,
  ) {
    const minDepositMultiplier = minDepositPercent / 100
    const minDepositAbsolute = 0.000001 // @todo move to fee config

    // Calculate the amount of ATOM for the listing fee
    // The listing fee is mindep % of amount * ppt
    let listingFee = amount * pricePerToken * minDepositMultiplier
    // Avoid very small listing fees
    if (listingFee < minDepositAbsolute) {
      listingFee = minDepositAbsolute
    }
    // Convert to uatom
    listingFee = listingFee * 10 ** 6
    listingFee = Math.floor(listingFee)

    return this.prepareOperation(
      this.protocol.listCFT20(
        ticker,
        amount,
        pricePerToken,
        minDepositMultiplier,
        timeoutBlocks,
      ),
      undefined,
      listingFee.toString(),
    )
  }
}
