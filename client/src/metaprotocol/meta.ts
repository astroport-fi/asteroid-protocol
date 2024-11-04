import { DEFAULT_FEE_AMOUNT, DEFAULT_FEE_RECEIVER } from '../constants.js'
import {
  BaseProtocol,
  MetaProtocolParams,
  ProtocolFee,
  buildOperation,
} from './index.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: DEFAULT_FEE_RECEIVER,
  fee: DEFAULT_FEE_AMOUNT,
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
