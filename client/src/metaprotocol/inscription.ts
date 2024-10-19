import { buildInscriptionData, buildOperation } from './build.js'
import {
  BaseProtocol,
  InscriptionData,
  MetaProtocolParams,
  ProtocolFee,
} from './types.js'

export type ContentMetadata = {
  name: string
  description: string
  mime: string
  isExplicit?: boolean
}

export interface CollectionMetadata extends ContentMetadata {
  symbol: string
  minter?: string
  royalty_percentage?: number
  payment_address?: string
  website?: string
  twitter?: string
  discord?: string
  telegram?: string
}

export interface Trait {
  display_type?: string | null
  trait_type: string
  value: string
}

export interface NFTMetadata extends ContentMetadata {
  attributes?: Trait[] | null
  filename?: string
  token_id?: number
  price?: number
}

export type Parent = {
  type: string
  identifier: string
}

export interface MigrationData {
  header: string[]
  rows: string[][]
  collection?: string
}

const DEFAULT_FEE: ProtocolFee = {
  ibcChannel: 'channel-569',
  receiver:
    'neutron1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqgzfr8p',
  denom: 'uatom',
  operations: {},
}

export function accountIdentifier(accountAddress: string) {
  return {
    type: '/cosmos.bank.Account',
    identifier: accountAddress,
  }
}

export function collectionIdentifier(collection: string) {
  return {
    type: '/collection',
    identifier: collection,
  }
}

export default class InscriptionProtocol extends BaseProtocol {
  static DEFAULT_FEE = DEFAULT_FEE
  version = 'v2'
  name = 'inscription'

  constructor(chainId: string, fee: ProtocolFee = DEFAULT_FEE) {
    super(chainId, fee)
  }

  createInscriptionData<T = ContentMetadata>(
    content: Uint8Array,
    metadata: T,
    parent: Parent,
  ): Required<InscriptionData> {
    return buildInscriptionData(
      parent.type,
      parent.identifier,
      content,
      metadata,
    )
  }

  inscribe(hash: string) {
    const params: MetaProtocolParams = [['h', hash]]
    return buildOperation(this, this.fee, this.chainId, 'inscribe', params)
  }

  updateCollection(hash: string) {
    const params: MetaProtocolParams = [['h', hash]]
    return buildOperation(
      this,
      this.fee,
      this.chainId,
      'update-collection',
      params,
    )
  }

  transfer(hash: string, destination: string) {
    const params: MetaProtocolParams = [
      ['h', hash],
      ['dst', destination],
    ]
    return buildOperation(this, this.fee, this.chainId, 'transfer', params)
  }

  migrate() {
    return buildOperation(this, this.fee, this.chainId, 'migrate', [])
  }

  grantMigrationPermission(hash: string, grantee: string) {
    const params: MetaProtocolParams = [
      ['h', hash],
      ['grantee', grantee],
    ]
    return buildOperation(
      this,
      this.fee,
      this.chainId,
      'grant-migration-permission',
      params,
    )
  }
}
