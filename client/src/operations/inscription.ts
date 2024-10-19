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

  inscribeCollectionInscription<M = NFTMetadata>(
    collection: string,
    content: Uint8Array,
    metadata: M,
  ) {
    return this.inscribe(content, metadata, collectionIdentifier(collection))
  }

  inscribeCollection(content: Uint8Array, metadata: CollectionMetadata) {
    return this.inscribe(content, metadata)
  }

  updateCollection(
    hash: string,
    collectionMetadata: Partial<CollectionMetadata>,
  ) {
    const operation = this.protocol.updateCollection(hash)
    return this.prepareOperation(operation, { metadata: collectionMetadata })
  }

  transfer(hash: string, destination: string) {
    return this.prepareOperation(this.protocol.transfer(hash, destination))
  }

  migrate(migrationData: MigrationData) {
    const operation = this.protocol.migrate()
    return this.prepareOperation(operation, { metadata: migrationData })
  }

  grantMigrationPermission(hash: string, grantee: string) {
    return this.prepareOperation(
      this.protocol.grantMigrationPermission(hash, grantee),
    )
  }
}
