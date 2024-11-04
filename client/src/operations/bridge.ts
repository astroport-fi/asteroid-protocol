import BridgeProtocol from '../metaprotocol/bridge.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export class BridgeOperations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: BridgeProtocol
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new BridgeProtocol(chainId, options.fee)
    this.address = address
    this.options = options
  }

  enable(ticker: string, remoteChain: string, remoteContract: string) {
    return this.prepareOperation(
      this.protocol.enable(ticker, remoteChain, remoteContract),
    )
  }

  send(
    ticker: string,
    amount: number,
    remoteChain: string,
    remoteContract: string,
    receiver: string,
  ) {
    return this.prepareOperation(
      this.protocol.send(ticker, amount, remoteChain, remoteContract, receiver),
    )
  }

  recv(
    ticker: string,
    amount: number,
    remoteChain: string,
    remoteSender: string,
    receiver: string,
  ) {
    return this.prepareOperation(
      this.protocol.recv(ticker, amount, remoteChain, remoteSender, receiver),
    )
  }
}
