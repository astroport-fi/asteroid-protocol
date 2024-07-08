import { MsgSendEncodeObject } from '@cosmjs/stargate'
import { TOKEN_DECIMALS } from '../constants.js'
import { createSendMessage } from '../helpers/msg.js'
import MarketplaceProtocol, { BuyType } from '../metaprotocol/marketplace.js'
import { InscriptionData } from '../metaprotocol/types.js'
import { AsteroidService, Listing, Status } from '../service/asteroid.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

interface MsgResult {
  error?: string
  msg?: MsgSendEncodeObject
}

interface BuyResult {
  error?: string
  msgs?: MsgSendEncodeObject[]
  total?: bigint
}

export interface Royalty {
  recipient: string
  percentage: number
}

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
    const minDepositAbsolute = 1
    const totalBase = amount * pricePerToken * 10 ** TOKEN_DECIMALS

    // Calculate the amount of ATOM for the listing fee
    // The listing fee is mindep % of amount * ppt
    let listingFee = totalBase * minDepositMultiplier
    // Avoid very small listing fees
    if (listingFee < minDepositAbsolute) {
      listingFee = minDepositAbsolute
    }
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
    const minDepositAbsolute = 1
    const totalBase = price * 10 ** TOKEN_DECIMALS

    // Calculate the amount of ATOM for the listing fee
    // The listing fee is mindep % of amount * ppt
    let listingFee = totalBase * minDepositMultiplier
    // Avoid very small listing fees
    if (listingFee < minDepositAbsolute) {
      listingFee = minDepositAbsolute
    }
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

  private async depositListing(
    status: Status,
    listingHash: string,
  ): Promise<MsgResult> {
    // check if listing exists
    const listing = await this.asteroidService.fetchListing(listingHash)
    if (!listing) {
      return { error: 'Listing not found' }
    }

    // check if listing is already cancelled or filled
    if (listing.is_cancelled || listing.is_filled) {
      return { error: 'This listing has already been cancelled or filled' }
    }

    // check if someone else has already deposited
    if (listing.is_deposited && this.address != listing.depositor_address) {
      if (listing.depositor_timedout_block! > status.last_known_height!) {
        return {
          error:
            'This listing already has a deposit, wait for the deposit to expire or choose a different listing',
        }
      }
    } else if (this.address == listing.depositor_address) {
      // we are the depositor, let's check if timeout didn't expire yet
      if (listing.depositor_timedout_block! > status.last_known_height!) {
        return {
          error:
            'You already have a deposit on this listing, you need to buy it now',
        }
      }
    }

    const deposit = BigInt(listing.deposit_total)

    const depositMsg = createSendMessage(
      this.address,
      listing.seller_address,
      'uatom',
      deposit.toString(),
    )
    return { msg: depositMsg }
  }

  async deposit(listingHash: string | string[]) {
    if (!Array.isArray(listingHash)) {
      listingHash = [listingHash]
    }

    const status = await this.asteroidService.getStatus(this.protocol.chainId)

    const messages: MsgSendEncodeObject[] = []
    const availableListings: string[] = []
    let error: string | undefined

    for (const hash of listingHash) {
      const result = await this.depositListing(status, hash)
      if (result.error) {
        error = result.error
        console.warn(`Error buying listing ${hash}: ${error}`)
      } else {
        messages.push(result.msg!)
        availableListings.push(hash)
      }
    }

    if (messages.length === 0) {
      throw new Error(error ?? 'No valid listings to deposit')
    }

    // prepare operation
    let listingHashParam: string | undefined
    let inscriptionData: InscriptionData | undefined
    if (availableListings.length === 1) {
      listingHashParam = availableListings[0]
    } else {
      inscriptionData = {
        metadata: availableListings,
      }
    }

    return this.prepareOperation(
      this.protocol.deposit(listingHashParam),
      inscriptionData,
      undefined,
      messages,
    )
  }

  async getListing(
    lastKnownHeight: number,
    listingHash: string,
  ): Promise<{ error: string } | { listing: Listing }> {
    // check if listing exists
    const listing = await this.asteroidService.fetchListing(listingHash)
    if (!listing) {
      return { error: 'Listing not found' }
    }

    // check if listing is already cancelled or filled
    if (listing.is_cancelled || listing.is_filled) {
      return {
        error: 'This listing has already been cancelled or filled',
      }
    }

    if (!listing.is_deposited || listing.depositor_address != this.address) {
      return {
        error: 'You need to deposit first and you must be the depositor',
      }
    }
    // check timeout didn't expire
    if (lastKnownHeight > listing.depositor_timedout_block!) {
      return { error: 'Deposit timeout expired' }
    }

    return { listing }
  }

  private async buyListing(
    lastKnownHeight: number,
    listingHash: string,
    royalty?: Royalty,
  ): Promise<BuyResult> {
    const res = await this.getListing(lastKnownHeight, listingHash)
    if ('error' in res) {
      return { error: res.error }
    }

    const listing = res.listing

    let totaluatom = BigInt(listing.total)
    const deposit = BigInt(listing.deposit_total)
    if (deposit > totaluatom) {
      // If deposit is greater than total, then just sent 1uatom to complete the transaction
      totaluatom = BigInt(1)
    } else {
      // Subtract deposit amount already sent
      totaluatom -= deposit
    }

    const messages: MsgSendEncodeObject[] = []

    // Add royalty if exists
    if (
      royalty &&
      totaluatom > 1 &&
      royalty.recipient != listing.seller_address
    ) {
      const royaltyFloatAmount = listing.total * royalty.percentage
      if (royaltyFloatAmount > 1) {
        const royaltyAmount = BigInt(royaltyFloatAmount.toFixed())

        const royaltyMessage = createSendMessage(
          this.address,
          royalty.recipient,
          'uatom',
          royaltyAmount.toString(),
        )
        messages.push(royaltyMessage)

        totaluatom -= royaltyAmount
      }
    }

    // add purchase message
    const purchaseMessage = createSendMessage(
      this.address,
      listing.seller_address,
      'uatom',
      totaluatom.toString(),
    )
    messages.push(purchaseMessage)

    return { msgs: messages, total: totaluatom }
  }

  async buy(
    listingHash: string | string[],
    buyType: BuyType,
    royalty?: Royalty | Royalty[],
  ) {
    if (!Array.isArray(listingHash)) {
      listingHash = [listingHash]
    }
    if (royalty && !Array.isArray(royalty)) {
      royalty = [royalty]
    }

    // check timeout didn't expire
    const status = await this.asteroidService.getStatus(this.protocol.chainId)
    const lastKnownHeight = status.last_known_height as number

    const messages: MsgSendEncodeObject[] = []
    let totaluatom = BigInt(0)
    let error: string | undefined
    const availableListings: string[] = []

    for (let i = 0; i < listingHash.length; i++) {
      const listing = listingHash[i]
      const result = await this.buyListing(
        lastKnownHeight,
        listing,
        royalty?.[i],
      )
      if (result.error) {
        error = result.error
        console.warn(`Error buying listing ${listing}: ${error}`)
      } else {
        messages.push(...result.msgs!)
        totaluatom += result.total!
        availableListings.push(listing)
      }
    }

    if (messages.length === 0) {
      throw new Error(error ?? 'No valid listings to buy')
    }

    // prepare operation
    let listingHashParam: string | undefined
    let inscriptionData: InscriptionData | undefined
    if (availableListings.length === 1) {
      listingHashParam = availableListings[0]
    } else {
      inscriptionData = {
        metadata: availableListings,
      }
    }

    const operation = this.protocol.buy(listingHashParam, buyType)

    // Calculate the trading fee
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

    return this.prepareOperation(operation, inscriptionData, buyFee, messages)
  }
}
