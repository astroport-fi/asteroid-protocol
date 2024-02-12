import {
  BaseProtocol,
  Inscription,
  MetaProtocolParams,
  ProtocolFee,
  buildInscription,
  buildOperation,
} from './index.js'

export type ContentMetadata = {
  name: string
  description: string
  mime: string
  isExplicit?: boolean
}

export type Parent = {
  type: string
  identifier: string
}

export type InscriptionMetadata<T = ContentMetadata> = {
  parent: Parent
  metadata: T
}

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
  denom: 'uatom',
  operations: {},
}

export function accountIdentifier(accountAddress: string) {
  return {
    type: '/cosmos.bank.Account',
    identifier: accountAddress,
  }
}

export default class InscriptionProtocol extends BaseProtocol {
  version = 'v1'
  name = 'inscription'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  createInscription<T = ContentMetadata>(
    data: string | Buffer,
    metadata: T,
    parent: Parent,
  ): Inscription {
    const inscriptionMetadata: InscriptionMetadata<T> = {
      parent,
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
