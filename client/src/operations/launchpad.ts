import LaunchpadProtocol, { LaunchMetadata } from '../metaprotocol/launchpad.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export class LaunchpadOperations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: LaunchpadProtocol
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new LaunchpadProtocol(chainId, options.fee)
    this.address = address
    this.options = options
  }

  launch(collectionHash: string, metadata: LaunchMetadata) {
    const operation = this.protocol.launch(collectionHash)
    return this.prepareOperation(operation, { metadata })
  }

  // @todo signature
  reserve(launchpadHash: string, mintStage: number, amount: number = 1) {
    const operation = this.protocol.reserve(launchpadHash, mintStage, amount)
    return this.prepareOperation(operation)
  }
}
