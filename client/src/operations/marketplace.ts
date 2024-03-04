import { TOKEN_DECIMALS } from '../constants.js'
import { createSendMessage } from '../helpers/msg.js'
import MarketplaceProtocol, { BuyType } from '../metaprotocol/marketplace.js'
import { AsteroidService } from '../service/asteroid.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export class MarketplaceOperations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: MarketplaceProtocol
  asteroidService: AsteroidService
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    asteroidService: AsteroidService,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new MarketplaceProtocol(chainId, options.fee)
    this.address = address
    this.asteroidService = asteroidService
    this.options = options
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
    // Convert to uatom decimals from config
    listingFee = listingFee * 10 ** TOKEN_DECIMALS
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

  listInscription(
    hash: string,
    price: number,
    minDepositPercent: number,
    timeoutBlocks: number,
  ) {
    const minDepositMultiplier = minDepositPercent / 100
    const minDepositAbsolute = 0.000001 // @todo move to fee config

    // Calculate the amount of ATOM for the listing fee
    // The listing fee is mindep % of amount * ppt
    let listingFee = price * minDepositMultiplier
    // Avoid very small listing fees
    if (listingFee < minDepositAbsolute) {
      listingFee = minDepositAbsolute
    }
    // Convert to uatom decimals from config
    listingFee = listingFee * 10 ** TOKEN_DECIMALS
    listingFee = Math.floor(listingFee)

    return this.prepareOperation(
      this.protocol.listInscription(
        hash,
        price,
        minDepositMultiplier,
        timeoutBlocks,
      ),
      undefined,
      listingFee.toString(),
    )
  }

  delist(listingHash: string) {
    return this.prepareOperation(this.protocol.delist(listingHash))
  }

  async deposit(listingHash: string) {
    // check if listing exists
    const listing = await this.asteroidService.fetchListing(listingHash)
    if (!listing) {
      throw new Error('Listing not found')
    }

    // check if listing is already cancelled or filled
    if (listing.is_cancelled || listing.is_filled) {
      throw new Error('This listing has already been cancelled or filled')
    }

    const status = await this.asteroidService.getStatus(this.protocol.chainId)

    // check if someone else has already deposited
    if (listing.is_deposited && this.address != listing.depositor_address) {
      if (listing.depositor_timedout_block! > status.last_known_height!) {
        throw new Error(
          'This listing already has a deposit, wait for the deposit to expire or choose a different listing',
        )
      }
    } else if (this.address == listing.depositor_address) {
      // we are the depositor, let's check if timeout didn't expire yet
      if (listing.depositor_timedout_block! > status.last_known_height!) {
        throw new Error(
          'You already have a deposit on this listing, you need to buy it now',
        )
      }
    }

    const deposit = BigInt(listing.deposit_total)

    const purchaseMessage = createSendMessage(
      this.address,
      listing.seller_address,
      'uatom',
      deposit.toString(),
    )

    return this.prepareOperation(
      this.protocol.deposit(listingHash),
      undefined,
      undefined,
      [purchaseMessage],
    )
  }

  async buy(listingHash: string, buyType: BuyType) {
    // check if listing exists
    const listing = await this.asteroidService.fetchListing(listingHash)
    if (!listing) {
      throw new Error('Listing not found')
    }

    // check if listing is already cancelled or filled
    if (listing.is_cancelled || listing.is_filled) {
      throw new Error('This listing has already been cancelled or filled')
    }

    if (!listing.is_deposited || listing.depositor_address != this.address) {
      throw new Error('You need to deposit first and you must be the depositor')
    }
    // check timeout didn't expire
    const status = await this.asteroidService.getStatus(this.protocol.chainId)
    if (status.last_known_height! > listing.depositor_timedout_block!) {
      throw new Error('Deposit timeout expired')
    }

    let totaluatom = BigInt(listing.total)
    const deposit = BigInt(listing.deposit_total)
    if (deposit > totaluatom) {
      // If deposit is greater than total, then just sent 1uatom to complete the transaction
      totaluatom = BigInt(1)
    } else {
      // Subtract deposit amount already sent
      totaluatom -= deposit
    }

    const purchaseMessage = createSendMessage(
      this.address,
      listing.seller_address,
      'uatom',
      totaluatom.toString(),
    )

    // Calculate the trading fee
    const operation = this.protocol.buy(listingHash, buyType)
    const decimalTotal =
      parseFloat(totaluatom.toString()) / 10 ** TOKEN_DECIMALS

    const feePercentage = parseFloat(operation.fee.amount)
    let buyFee = operation.fee.amount
    if (operation.fee.type == 'dynamic-percent') {
      let fee = decimalTotal * feePercentage
      if (fee < 0.000001) {
        fee = 0.000001
      }
      fee = fee * 10 ** TOKEN_DECIMALS
      buyFee = fee.toFixed(0)
    }

    return this.prepareOperation(operation, undefined, buyFee, [
      purchaseMessage,
    ])
  }
}
