import { sha256 } from '@cosmjs/crypto'
import { toHex } from '@cosmjs/encoding'
import {
  InscriptionData,
  MetaProtocol,
  MetaProtocolParams,
  Operation,
  OperationFee,
  ProtocolFee,
} from './types.js'

export function buildURN(
  metaProtocol: MetaProtocol,
  chainId: string,
  operation: string,
  params: MetaProtocolParams,
) {
  // urn:{metaprotocol}:{chain-id}@{version};{op}${param1}={value1},{param2}={value2},{param3}={value3}
  const paramString = params.map(([key, value]) => `${key}=${value}`).join(',')
  const urn = `urn:${metaProtocol.name}:${chainId}@${metaProtocol.version};${operation}$${paramString}`

  return urn
}

export function getOperationFee(
  protocolFee: ProtocolFee,
  operation: string,
): OperationFee {
  const operationFee = protocolFee.operations[operation]
  if (!operationFee) {
    return {
      amount: '0',
    }
  }
  return operationFee
}

export function buildOperation(
  metaProtocol: MetaProtocol,
  fee: ProtocolFee,
  chainId: string,
  operation: string,
  params: MetaProtocolParams,
): Operation {
  return {
    urn: buildURN(metaProtocol, chainId, operation, params),
    fee: getOperationFee(fee, operation),
  }
}

export function buildInscriptionData<T = unknown>(
  parentType: string,
  parentIdentifier: string,
  content: Uint8Array,
  metadata: T,
): InscriptionData {
  const hash = toHex(sha256(content))

  return {
    parentType,
    parentIdentifier,
    content,
    metadata,
    hash,
  }
}
