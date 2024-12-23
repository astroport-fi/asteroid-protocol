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

export interface MintStage {
  id?: number
  name?: string
  description?: string
  start?: Date
  finish?: Date
  price?: number
  whitelist?: string[]
  maxPerUser?: number
}

export interface LaunchMetadata {
  supply?: number
  stages: MintStage[]
  revealImmediately: boolean
  revealDate?: Date
}

export default class LaunchpadProtocol extends BaseProtocol {
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v2'
  name = 'launchpad'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  launch(collectionHash: string) {
    const params: MetaProtocolParams = [['h', collectionHash]]
    return buildOperation(this, this.fee, this.chainId, 'launch', params)
  }

  update(collectionHash: string) {
    const params: MetaProtocolParams = [['h', collectionHash]]
    return buildOperation(this, this.fee, this.chainId, 'update', params)
  }

  reserve(launchpadHash: string, mintStage: number, amount: number = 1) {
    const params: MetaProtocolParams = [
      ['h', launchpadHash],
      ['stg', mintStage],
      ['amt', amount],
    ]
    return buildOperation(this, this.fee, this.chainId, 'reserve', params)
  }
}
