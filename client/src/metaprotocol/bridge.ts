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

export default class BridgeProtocol extends BaseProtocol {
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v1'
  name = 'bridge'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  enable(ticker: string, remoteChain: string, remoteContract: string) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['rch', remoteChain],
      ['rco', remoteContract],
    ]
    return buildOperation(this, this.fee, this.chainId, 'enable', params)
  }

  send(
    ticker: string,
    amount: number,
    remoteChain: string,
    remoteContract: string,
    receiver: string,
  ) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['amt', amount],
      ['rch', remoteChain],
      ['rco', remoteContract],
      ['dst', receiver],
    ]
    return buildOperation(this, this.fee, this.chainId, 'send', params)
  }

  recv(
    ticker: string,
    amount: number,
    remoteChain: string,
    remoteSender: string,
    receiver: string,
  ) {
    const params: MetaProtocolParams = [
      ['tic', ticker],
      ['amt', amount],
      ['rch', remoteChain],
      ['src', remoteSender],
      ['dst', receiver],
    ]
    return buildOperation(this, this.fee, this.chainId, 'recv', params)
  }
}
