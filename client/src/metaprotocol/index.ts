import { sha256 } from '@cosmjs/crypto'
import { toHex } from '@cosmjs/encoding'

export interface MetaProtocol {
  version: string
  name: string
}

export type MetaProtocolParams = Array<[string, string | number]>

export interface InscriptionData {
  content: Uint8Array
  metadata: unknown
  parentType: string
  parentIdentifier: string
  hash: string
}

export interface OperationFee {
  amount: string
  type?: 'dynamic-percent'
}

export interface Operation {
  urn: string
  fee: OperationFee
}

export interface ProtocolFee {
  receiver: string
  ibcChannel: string
  denom: string
  operations: Record<string, OperationFee>
}

export abstract class BaseProtocol implements MetaProtocol {
  chainId: string
  fee: ProtocolFee
  abstract version: string
  abstract name: string

  constructor(chainId: string, fee: ProtocolFee) {
    this.chainId = chainId
    this.fee = fee
  }
}

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
