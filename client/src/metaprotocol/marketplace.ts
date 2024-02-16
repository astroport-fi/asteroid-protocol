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
  operations: {
    'buy.cft20': {
      amount: '0.02', // Default 2%
      type: 'dynamic-percent',
    },
    'buy.inscription': {
      amount: '0.02', // Default 2%
      type: 'dynamic-percent',
    },
  },
}

export type BuyType = 'cft20' | 'inscription'

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
      ['amt', amount],
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

  buy(listingHash: string, buyType: BuyType) {
    const params: MetaProtocolParams = [['h', listingHash]]
    return buildOperation(
      this,
      this.fee,
      this.chainId,
      `buy.${buyType}`,
      params,
    )
  }
}
