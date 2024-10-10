import { buildOperation } from './build.js'
import { BaseProtocol, MetaProtocolParams, ProtocolFee } from './types.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver:
    'neutron1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqgzfr8p',
  denom: 'uatom',
  operations: {},
}

export interface TrollBoxMetadata {
  text: string
  mime: string
}

export default class TrollBoxProtocol extends BaseProtocol {
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v1'
  name = 'trollbox'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  post(hash: string) {
    const params: MetaProtocolParams = [['h', hash]]
    return buildOperation(this, this.fee, this.chainId, 'post', params)
  }

  collect(hash: string, amount: number = 1) {
    const params: MetaProtocolParams = [
      ['h', hash],
      ['amt', amount],
    ]
    return buildOperation(this, this.fee, this.chainId, 'collect', params)
  }
}
