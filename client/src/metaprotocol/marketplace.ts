import {
  BaseProtocol,
  MetaProtocolParams,
  ProtocolFee,
  buildOperation,
} from './index.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
  denom: 'uatom',
  operations: {},
}

export default class MarketplaceProtocol extends BaseProtocol {
  version = 'v1'
  name = 'marketplace'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  listCFT20(
    ticker: string,
    amount: number,
    pricePerToken: number,
    minDeposit: number,
    timeoutBlocks: number,
  ) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['amt', amount],
      ['ppt', pricePerToken],
      ['mindep', minDeposit],
      ['to', timeoutBlocks],
    ]
    return buildOperation(this, this.fee, this.chainId, 'list.cft20', params)
  }

  listInscription(
    hash: string,
    amount: number,
    minDeposit: number,
    timeoutBlocks: number,
  ) {
    const params: MetaProtocolParams = [
      ['h', hash],
      ['total', amount],
      ['mindep', minDeposit],
      ['to', timeoutBlocks],
    ]
    return buildOperation(
      this,
      this.fee,
      this.chainId,
      'list.inscription',
      params,
    )
  }

  deposit(listingHash: string) {
    const params: MetaProtocolParams = [['h', listingHash]]
    return buildOperation(this, this.fee, this.chainId, 'deposit', params)
  }

  delist(listingHash: string) {
    const params: MetaProtocolParams = [['h', listingHash]]
    return buildOperation(this, this.fee, this.chainId, 'delist', params)
  }

  buyCFT20(listingHash: string) {
    const params: MetaProtocolParams = [['h', listingHash]]
    return buildOperation(this, this.fee, this.chainId, 'buy.cft20', params)
  }
}
