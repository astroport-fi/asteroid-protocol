import InscriptionProtocol, {
  CollectionMetadata,
  MigrationData,
  NFTMetadata,
  Parent,
  accountIdentifier,
  collectionIdentifier,
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

  inscribe<M = NFTMetadata>(content: Uint8Array, metadata: M, parent?: Parent) {
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

  inscribeCollectionInscription(
    collection: string,
    content: Uint8Array,
    metadata: NFTMetadata,
  ) {
    return this.inscribe(content, metadata, collectionIdentifier(collection))
  }

  inscribeCollection(content: Uint8Array, metadata: CollectionMetadata) {
    return this.inscribe(content, metadata)
  }

  transfer(hash: string, destination: string) {
    return this.prepareOperation(this.protocol.transfer(hash, destination))
  }

  migrate(data: MigrationData) {
    const parent = accountIdentifier(this.address)

    const inscriptionData = this.protocol.createInscriptionData(
      Uint8Array.from([]),
      data,
      parent,
    )
    const operation = this.protocol.migrate()
    return this.prepareOperation(operation, inscriptionData)
  }

  grantMigrationPermission(hash: string, grantee: string) {
    return this.prepareOperation(
      this.protocol.grantMigrationPermission(hash, grantee),
    )
  }
}
