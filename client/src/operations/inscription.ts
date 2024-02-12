import InscriptionProtocol, {
  ContentInscription,
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

  inscribe(data: string | Buffer, metadata: ContentInscription) {
    const inscription = this.protocol.createInscription(
      this.address,
      data,
      metadata,
    )
    const operation = this.protocol.inscribe(inscription.hash)
    return this.prepareOperation(operation, inscription)
  }

  transfer(hash: string, destination: string) {
    return this.prepareOperation(this.protocol.transfer(hash, destination))
  }
}
