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
    this.protocol = new InscriptionProtocol(chainId)
    this.address = address
    this.options = options
  }

  inscribe<T = ContentMetadata>(
    data: string | Buffer,
    metadata: T,
    parent?: Parent,
  ) {
    if (!parent) {
      parent = accountIdentifier(this.address)
    }

    const inscriptionContent = this.protocol.createInscriptionContent(
      data,
      metadata,
      parent,
    )
    const operation = this.protocol.inscribe(inscriptionContent.hash)
    return this.prepareOperation(operation, inscriptionContent)
  }

  transfer(hash: string, destination: string) {
    return this.prepareOperation(this.protocol.transfer(hash, destination))
  }
}
