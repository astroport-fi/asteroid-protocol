import {
  BaseProtocol,
  MetaProtocolParams,
  ProtocolFee,
  buildOperation,
} from './index.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver:
    'neutron1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqgzfr8p',
  denom: 'uatom',
  operations: {},
}

export default class MetaProtocol extends BaseProtocol {
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v1'
  name = 'meta'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  execute() {
    const params: MetaProtocolParams = []
    return buildOperation(this, this.fee, this.chainId, 'execute', params)
  }
}
