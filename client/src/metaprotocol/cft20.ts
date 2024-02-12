import {
  BaseProtocol,
  Inscription,
  MetaProtocol,
  MetaProtocolParams,
  ProtocolFee,
  buildInscription,
  buildOperation,
} from './index.js'
import { InscriptionMetadata } from './inscription.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
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
  version = 'v1'
  name = 'cft20'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  createLogoInscription(
    accountAddress: string,
    data: string | Buffer,
    mime: string,
  ): Inscription {
    const inscriptionMetadata: InscriptionMetadata = {
      parent: {
        type: '/cosmos.bank.Account',
        identifier: accountAddress,
      },
      metadata: {
        name: 'Token Logo',
        description: 'Token Logo',
        mime,
      },
    }

    return buildInscription(data, inscriptionMetadata)
  }

  deploy(
    name: string,
    ticker: string,
    maxSupply: number,
    decimals: number,
    mintLimit: number,
    openTime: Date,
  ) {
    const params: MetaProtocolParams = [
      ['nam', name],
      ['tic', ticker],
      ['sup', maxSupply],
      ['dec', decimals],
      ['lim', mintLimit],
      ['opn', Math.round(openTime.getTime() / 1000)],
    ]
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
}
