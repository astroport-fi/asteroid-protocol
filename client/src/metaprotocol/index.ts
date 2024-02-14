import { toBase64, toUtf8 } from '@cosmjs/encoding'
import { hashValue } from '../crypto.js'

export interface MetaProtocol {
  version: string
  name: string
}

export type MetaProtocolParams = Array<[string, string | number]>

export interface InscriptionContent {
  data: string // data base64
  metadata: string // metadata base64
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

export function buildInscriptionContent(
  data: string | Buffer,
  metadata: unknown,
): InscriptionContent {
  let dataStr: string
  if (Buffer.isBuffer(data)) {
    dataStr = data.toString('base64')
  } else {
    dataStr = data
  }
  const metadataBase64 = toBase64(toUtf8(JSON.stringify(metadata)))
  const hash = hashValue(metadataBase64 + dataStr)

  return {
    hash,
    data: dataStr,
    metadata: metadataBase64,
  }
}
