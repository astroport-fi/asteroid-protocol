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

export default class MetaProtocol extends BaseProtocol {
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
