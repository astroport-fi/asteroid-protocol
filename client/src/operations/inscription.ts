import InscriptionProtocol, {
  ContentMetadata,
  Parent,
  accountIdentifier,
} from '../metaprotocol/inscription.js'
import { OperationsBase } from './index.js'

export class InscriptionOperations extends OperationsBase {
  protocol: InscriptionProtocol
  address: string

  constructor(chainId: string, address: string) {
    super()
    this.protocol = new InscriptionProtocol(chainId)
    this.address = address
  }

  inscribe<T = ContentMetadata>(
    data: string | Buffer,
    metadata: T,
    parent?: Parent,
  ) {
    if (!parent) {
      parent = accountIdentifier(this.address)
    }

    const inscription = this.protocol.createInscription(data, metadata, parent)
    const operation = this.protocol.inscribe(inscription.hash)
    return this.prepareOperation(operation, inscription)
  }

  transfer(hash: string, destination: string) {
    return this.prepareOperation(this.protocol.transfer(hash, destination))
  }
}
