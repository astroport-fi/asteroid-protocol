import { hashContent } from '../metaprotocol/build.js'
import TrollBoxProtocol, { TrollBoxMetadata } from '../metaprotocol/trollbox.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export class TrollBoxOperations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: TrollBoxProtocol
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new TrollBoxProtocol(chainId, options.fee)
    this.address = address
    this.options = options
  }

  post(content: Uint8Array, metadata: TrollBoxMetadata) {
    const hash = hashContent(content)
    const operation = this.protocol.post(hash)
    return this.prepareOperation(operation, { metadata, content, hash })
  }

  collect(hash: string, amount: number = 1) {
    const operation = this.protocol.collect(hash, amount)
    return this.prepareOperation(operation)
  }
}
