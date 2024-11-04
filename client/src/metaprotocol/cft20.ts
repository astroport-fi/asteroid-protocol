import { DEFAULT_FEE_AMOUNT, DEFAULT_FEE_RECEIVER } from '../constants.js'
import { buildInscriptionData, buildOperation } from './build.js'
import {
  BaseProtocol,
  InscriptionData,
  MetaProtocol,
  MetaProtocolParams,
  ProtocolFee,
} from './types.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: DEFAULT_FEE_RECEIVER,
  fee: DEFAULT_FEE_AMOUNT,
  denom: 'uatom',
  operations: {
    buy: {
      amount: '0.02', // Default 2%
      type: 'dynamic-percent',
    },
  },
}

export default class CFT20Protocol
  extends BaseProtocol
  implements MetaProtocol
{
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v1'
  name = 'cft20'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  createLogoInscription(
    accountAddress: string,
    content: Uint8Array,
    mime: string,
  ): InscriptionData {
    const metadata = {
      name: 'Token Logo',
      description: 'Token Logo',
      mime,
    }
    return buildInscriptionData(
      '/cosmos.bank.Account',
      accountAddress,
      content,
      metadata,
    )
  }

  deploy(
    name: string,
    ticker: string,
    maxSupply: number,
    decimals: number,
    mintLimit: number,
    openTime: Date,
    preMine?: number,
  ) {
    const params: MetaProtocolParams = [
      ['nam', name],
      ['tic', ticker],
      ['sup', maxSupply],
      ['dec', decimals],
      ['lim', mintLimit],
      ['opn', Math.round(openTime.getTime() / 1000)],
    ]
    if (preMine) {
      params.push(['pre', preMine])
    }
    return buildOperation(this, this.fee, this.chainId, 'deploy', params)
  }

  mint(ticker: string, amount: number) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['amt', amount],
    ]
    return buildOperation(this, this.fee, this.chainId, 'mint', params)
  }

  transfer(ticker: string, amount: number, destination: string) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['amt', amount],
      ['dst', destination],
    ]
    return buildOperation(this, this.fee, this.chainId, 'transfer', params)
  }

  burn(ticker: string, amount: number) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['amt', amount],
    ]
    return buildOperation(this, this.fee, this.chainId, 'burn', params)
  }

  delist(ticker: string, orderNumber: number) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['ord', orderNumber],
    ]
    return buildOperation(this, this.fee, this.chainId, 'delist', params)
  }
}
