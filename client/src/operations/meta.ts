import MetaProtocol from '../metaprotocol/meta.js'
import { TxData, TxInscription, prepareTx } from '../metaprotocol/tx.js'
import { OperationsBase, Options, getDefaultOptions } from './index.js'

export class MetaOperations<
  T extends boolean = false,
> extends OperationsBase<T> {
  protocol: MetaProtocol
  address: string
  options: Options<T>

  constructor(
    chainId: string,
    address: string,
    options: Options<T> = getDefaultOptions(),
  ) {
    super()
    this.protocol = new MetaProtocol(chainId)
    this.address = address
    this.options = options
  }

  execute(inscriptions: TxInscription[]): TxData {
    const operation = this.protocol.execute()
    return prepareTx(
      this.address,
      operation.urn,
      inscriptions,
      this.options.useIbc,
    )
  }
}
