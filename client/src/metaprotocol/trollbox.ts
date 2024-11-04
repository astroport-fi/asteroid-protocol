import { DEFAULT_FEE_AMOUNT, DEFAULT_FEE_RECEIVER } from '../constants.js'
import { buildOperation } from './build.js'
import { BaseProtocol, MetaProtocolParams, ProtocolFee } from './types.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver: DEFAULT_FEE_RECEIVER,
  fee: DEFAULT_FEE_AMOUNT,
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
