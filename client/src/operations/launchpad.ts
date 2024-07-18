import LaunchpadProtocol, { MintStage } from '../metaprotocol/launchpad.js'
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

  launch(
    collectionHash: string,
    supply: number | undefined,
    stages: MintStage[],
  ) {
    const operation = this.protocol.launch(collectionHash)
    return this.prepareOperation(operation, { metadata: { supply, stages } })
  }

  // @todo signature
  reserve(launchpadHash: string, mintStage: number) {
    const operation = this.protocol.reserve(launchpadHash, mintStage)
    return this.prepareOperation(operation)
  }
}
