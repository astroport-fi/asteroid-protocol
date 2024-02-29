import InscriptionProtocol, {
  ContentMetadata,
  Parent,
  accountIdentifier,
} from '../metaprotocol/inscription.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export class InscriptionOperations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: InscriptionProtocol
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new InscriptionProtocol(chainId, options.fee)
    this.address = address
    this.options = options
  }

  inscribe<M = ContentMetadata>(
    content: Uint8Array,
    metadata: M,
    parent?: Parent,
  ) {
    if (!parent) {
      parent = accountIdentifier(this.address)
    }

    const inscriptionData = this.protocol.createInscriptionData(
      content,
      metadata,
      parent,
    )
    const operation = this.protocol.inscribe(inscriptionData.hash)
    return this.prepareOperation(operation, inscriptionData)
  }

  transfer(hash: string, destination: string) {
    return this.prepareOperation(this.protocol.transfer(hash, destination))
  }
}
