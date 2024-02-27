import { EncodeObject } from '@cosmjs/proto-signing'
import {
  BaseProtocol,
  InscriptionData,
  Operation,
} from '../metaprotocol/index.js'
import { TxData, TxInscription, prepareTx } from '../metaprotocol/tx.js'

export interface Options<T extends boolean> {
  useIbc?: boolean
  useExtensionData?: boolean
  multi: T
}

export function getDefaultOptions<T extends boolean>() {
  return {
    useIbc: true,
    multi: false as T,
  }
}

type PrepareType<B> = B extends true ? TxInscription : TxData

export abstract class OperationsBase<T extends boolean> {
  abstract protocol: BaseProtocol
  abstract address: string
  abstract options: Options<T>

  protected prepareOperation(
    operation: Operation,
    inscriptionData?: InscriptionData,
    feeOverride?: string,
    messages?: readonly EncodeObject[],
  ): PrepareType<T> {
    const fee = {
      protocol: this.protocol.fee,
      operation: feeOverride ?? operation.fee.amount,
    }
    const inscription: TxInscription = {
      protocolName: this.protocol.name,
      protocolVersion: this.protocol.version,
      fee,
      data: inscriptionData,
      messages,
      urn: operation.urn,
    }

    if (this.options.multi) {
      return inscription as PrepareType<T>
    }

    return prepareTx(this.address, operation.urn, [inscription], {
      useIbc: this.options.useIbc,
      useExtensionData: this.options.useExtensionData,
    }) as PrepareType<T>
  }
}
