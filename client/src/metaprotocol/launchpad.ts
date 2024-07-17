import { buildOperation } from './build.js'
import { BaseProtocol, MetaProtocolParams, ProtocolFee } from './types.js'

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver:
    'neutron1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqgzfr8p',
  denom: 'uatom',
  operations: {},
}

export interface MintStage {
  name?: string
  description?: string
  start?: Date
  finish?: Date
  price?: number
  whitelist?: string[]
  maxPerUser?: number
}

export interface LaunchMetadata {
  supply: number
  stages: MintStage[]
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

  reserve(launchpadHash: string, mintStage: number) {
    const params: MetaProtocolParams = [
      ['h', launchpadHash],
      ['stg', mintStage],
    ]
    return buildOperation(this, this.fee, this.chainId, 'reserve', params)
  }
}
