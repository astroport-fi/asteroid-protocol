/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.9.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */
import { Coin, StdFee } from '@cosmjs/amino'
import {
  CosmWasmClient,
  ExecuteResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'
import {
  Addr,
  Config,
  ExecuteMsg,
  InstantiateMsg,
  QueryMsg,
  QuerySignersResponse,
  QueryTokensResponse,
  TokenMetadata,
  Uint128,
} from './AsteroidNeutronBridge.types'

export interface AsteroidNeutronBridgeReadOnlyInterface {
  contractAddress: string
  config: () => Promise<Config>
  signers: () => Promise<QuerySignersResponse>
  tokens: ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: string
  }) => Promise<QueryTokensResponse>
  disabledTokens: ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: string
  }) => Promise<QueryTokensResponse>
}
export class AsteroidNeutronBridgeQueryClient
  implements AsteroidNeutronBridgeReadOnlyInterface
{
  client: CosmWasmClient
  contractAddress: string
  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
    this.config = this.config.bind(this)
    this.signers = this.signers.bind(this)
    this.tokens = this.tokens.bind(this)
    this.disabledTokens = this.disabledTokens.bind(this)
  }
  config = async (): Promise<Config> => {
    return this.client.queryContractSmart(this.contractAddress, {
      config: {},
    })
  }
  signers = async (): Promise<QuerySignersResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      signers: {},
    })
  }
  tokens = async ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: string
  }): Promise<QueryTokensResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      tokens: {
        limit,
        start_after: startAfter,
      },
    })
  }
  disabledTokens = async ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: string
  }): Promise<QueryTokensResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      disabled_tokens: {
        limit,
        start_after: startAfter,
      },
    })
  }
}
export interface AsteroidNeutronBridgeInterface
  extends AsteroidNeutronBridgeReadOnlyInterface {
  contractAddress: string
  sender: string
  linkToken: (
    {
      signatures,
      sourceChainId,
      token,
    }: {
      signatures: string[]
      sourceChainId: string
      token: TokenMetadata
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  enableToken: (
    {
      ticker,
    }: {
      ticker: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  disableToken: (
    {
      ticker,
    }: {
      ticker: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  receive: (
    {
      amount,
      destinationAddr,
      signatures,
      sourceChainId,
      ticker,
      transactionHash,
    }: {
      amount: Uint128
      destinationAddr: string
      signatures: string[]
      sourceChainId: string
      ticker: string
      transactionHash: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  send: (
    {
      destinationAddr,
    }: {
      destinationAddr: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  retrySend: (
    {
      failureId,
    }: {
      failureId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  addSigner: (
    {
      name,
      publicKeyBase64,
    }: {
      name: string
      publicKeyBase64: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  removeSigner: (
    {
      publicKeyBase64,
    }: {
      publicKeyBase64: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  updateConfig: (
    {
      bridgeChainId,
      bridgeIbcChannel,
      ibcTimeoutSeconds,
      signerThreshold,
    }: {
      bridgeChainId?: string
      bridgeIbcChannel?: string
      ibcTimeoutSeconds?: number
      signerThreshold?: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  proposeNewOwner: (
    {
      expiresIn,
      owner,
    }: {
      expiresIn: number
      owner: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  dropOwnershipProposal: (
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
  claimOwnership: (
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[],
  ) => Promise<ExecuteResult>
}
export class AsteroidNeutronBridgeClient
  extends AsteroidNeutronBridgeQueryClient
  implements AsteroidNeutronBridgeInterface
{
  client: SigningCosmWasmClient
  sender: string
  contractAddress: string
  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string,
  ) {
    super(client, contractAddress)
    this.client = client
    this.sender = sender
    this.contractAddress = contractAddress
    this.linkToken = this.linkToken.bind(this)
    this.enableToken = this.enableToken.bind(this)
    this.disableToken = this.disableToken.bind(this)
    this.receive = this.receive.bind(this)
    this.send = this.send.bind(this)
    this.retrySend = this.retrySend.bind(this)
    this.addSigner = this.addSigner.bind(this)
    this.removeSigner = this.removeSigner.bind(this)
    this.updateConfig = this.updateConfig.bind(this)
    this.proposeNewOwner = this.proposeNewOwner.bind(this)
    this.dropOwnershipProposal = this.dropOwnershipProposal.bind(this)
    this.claimOwnership = this.claimOwnership.bind(this)
  }
  linkToken = async (
    {
      signatures,
      sourceChainId,
      token,
    }: {
      signatures: string[]
      sourceChainId: string
      token: TokenMetadata
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        link_token: {
          signatures,
          source_chain_id: sourceChainId,
          token,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  enableToken = async (
    {
      ticker,
    }: {
      ticker: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        enable_token: {
          ticker,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  disableToken = async (
    {
      ticker,
    }: {
      ticker: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        disable_token: {
          ticker,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  receive = async (
    {
      amount,
      destinationAddr,
      signatures,
      sourceChainId,
      ticker,
      transactionHash,
    }: {
      amount: Uint128
      destinationAddr: string
      signatures: string[]
      sourceChainId: string
      ticker: string
      transactionHash: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        receive: {
          amount,
          destination_addr: destinationAddr,
          signatures,
          source_chain_id: sourceChainId,
          ticker,
          transaction_hash: transactionHash,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  send = async (
    {
      destinationAddr,
    }: {
      destinationAddr: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        send: {
          destination_addr: destinationAddr,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  retrySend = async (
    {
      failureId,
    }: {
      failureId: number
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        retry_send: {
          failure_id: failureId,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  addSigner = async (
    {
      name,
      publicKeyBase64,
    }: {
      name: string
      publicKeyBase64: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        add_signer: {
          name,
          public_key_base64: publicKeyBase64,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  removeSigner = async (
    {
      publicKeyBase64,
    }: {
      publicKeyBase64: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        remove_signer: {
          public_key_base64: publicKeyBase64,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  updateConfig = async (
    {
      bridgeChainId,
      bridgeIbcChannel,
      ibcTimeoutSeconds,
      signerThreshold,
    }: {
      bridgeChainId?: string
      bridgeIbcChannel?: string
      ibcTimeoutSeconds?: number
      signerThreshold?: number
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_config: {
          bridge_chain_id: bridgeChainId,
          bridge_ibc_channel: bridgeIbcChannel,
          ibc_timeout_seconds: ibcTimeoutSeconds,
          signer_threshold: signerThreshold,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  proposeNewOwner = async (
    {
      expiresIn,
      owner,
    }: {
      expiresIn: number
      owner: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        propose_new_owner: {
          expires_in: expiresIn,
          owner,
        },
      },
      fee,
      memo,
      _funds,
    )
  }
  dropOwnershipProposal = async (
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        drop_ownership_proposal: {},
      },
      fee,
      memo,
      _funds,
    )
  }
  claimOwnership = async (
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    _funds?: Coin[],
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        claim_ownership: {},
      },
      fee,
      memo,
      _funds,
    )
  }
}
