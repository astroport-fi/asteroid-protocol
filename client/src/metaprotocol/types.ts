export interface MetaProtocol {
  version: string
  name: string
}

export type MetaProtocolParams = Array<[string, string | number]>

export interface InscriptionData {
  content?: Uint8Array
  metadata: unknown
  parentType?: string
  parentIdentifier?: string
  hash?: string
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
  fee?: string
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
