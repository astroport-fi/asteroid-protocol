import {
  BaseProtocol,
  Inscription,
  MetaProtocolParams,
  ProtocolFee,
  buildInscription,
  buildOperation,
} from './index.js'

export type ContentInscription = {
  name: string
  description: string
  mime: string
}

export type Parent = {
  type: string
  identifier: string
}

export type InscriptionMetadata = {
  parent: Parent
  metadata: ContentInscription
}

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
  denom: 'uatom',
  operations: {},
}

export default class InscriptionProtocol extends BaseProtocol {
  version = 'v1'
  name = 'inscription'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  createInscription(
    accountAddress: string,
    data: string | Buffer,
    metadata: ContentInscription,
  ): Inscription {
    const inscriptionMetadata: InscriptionMetadata = {
      parent: {
        type: '/cosmos.bank.Account',
        identifier: accountAddress,
      },
      metadata,
    }

    return buildInscription(data, inscriptionMetadata)
  }

  inscribe(hash: string) {
    const params: MetaProtocolParams = [['h', hash]]
    return buildOperation(this, this.fee, this.chainId, 'inscribe', params)
  }

  transfer(hash: string, destination: string) {
    const params: MetaProtocolParams = [
      ['h', hash],
      ['dst', destination],
    ]
    return buildOperation(this, this.fee, this.chainId, 'transfer', params)
  }
}
