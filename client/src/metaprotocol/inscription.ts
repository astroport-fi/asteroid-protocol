import {
  BaseProtocol,
  InscriptionData,
  MetaProtocolParams,
  ProtocolFee,
  buildInscriptionData,
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

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver:
    'neutron1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqgzfr8p',
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
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v1'
  name = 'inscription'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  createInscriptionData<T = ContentMetadata>(
    content: Uint8Array,
    metadata: T,
    parent: Parent,
  ): InscriptionData {
    return buildInscriptionData(
      parent.type,
      parent.identifier,
      content,
      metadata,
    )
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
