import {
  CosmWasmClient as CosmWasmClientOriginal,
  MsgExecuteContractEncodeObject,
  SigningCosmWasmClientOptions,
  SigningCosmWasmClient as SigningCosmWasmClientOriginal,
  WasmExtension,
  setupWasmExtension,
} from '@cosmjs/cosmwasm-stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { OfflineSigner } from '@cosmjs/proto-signing'
import {
  AuthExtension,
  BankExtension,
  Coin,
  GasPrice,
  HttpEndpoint,
  QueryClient,
  StdFee,
  calculateFee,
  setupAuthExtension,
  setupBankExtension,
} from '@cosmjs/stargate'
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc'
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx'
import { useEffect, useState } from 'react'
import { TxExtension, setupTxExtension } from './tx-extension'
import useChain from './useChain'

export class CosmWasmClient extends CosmWasmClientOriginal {
  public static async connect(
    endpoint: string | HttpEndpoint,
  ): Promise<CosmWasmClient> {
    const cometClient = await connectComet(endpoint)
    return CosmWasmClient.create(cometClient)
  }

  public static async create(
    cometClient: CometClient,
  ): Promise<CosmWasmClient> {
    return new CosmWasmClient(cometClient)
  }

  getDenomMetadata(denom: string) {
    return this.forceGetQueryClient().bank.denomMetadata(denom)
  }

  getAllBalances(address: string): Promise<readonly Coin[]> {
    return this.forceGetQueryClient().bank.allBalances(address)
  }
}

export class SigningCosmWasmClient extends SigningCosmWasmClientOriginal {
  private readonly customQueryClient:
    | (QueryClient &
        AuthExtension &
        BankExtension &
        TxExtension &
        WasmExtension)
    | undefined

  protected constructor(
    cometClient: CometClient | undefined,
    signer: OfflineSigner,
    options: SigningCosmWasmClientOptions,
  ) {
    super(cometClient, signer, options)
    if (cometClient) {
      this.customQueryClient = QueryClient.withExtensions(
        cometClient,
        setupAuthExtension,
        setupBankExtension,
        setupWasmExtension,
        setupTxExtension,
      )
    }
  }

  public static async connectWithSigner(
    endpoint: string | HttpEndpoint,
    signer: OfflineSigner,
    options: SigningCosmWasmClientOptions = {},
  ): Promise<SigningCosmWasmClient> {
    const cometClient = await connectComet(endpoint)
    return SigningCosmWasmClient.createWithSigner(cometClient, signer, options)
  }

  public static async createWithSigner(
    cometClient: CometClient,
    signer: OfflineSigner,
    options: SigningCosmWasmClientOptions = {},
  ): Promise<SigningCosmWasmClient> {
    return new SigningCosmWasmClient(cometClient, signer, options)
  }

  protected forceGetQueryClient(): QueryClient &
    AuthExtension &
    BankExtension &
    TxExtension &
    WasmExtension {
    if (!this.customQueryClient) {
      throw new Error(
        'Query client not available. You cannot use online functionality in offline mode.',
      )
    }
    return this.customQueryClient
  }

  async estimateExecuteMsg(
    sender: string,
    contract: string,
    msg: unknown,
    memo: string | undefined,
    fee: StdFee | 'auto' | number = 'auto',
    funds?: Coin[],
  ) {
    const contractMsg: MsgExecuteContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender,
        contract,
        msg: toUtf8(JSON.stringify(msg)),
        funds,
      }),
    }
    const gasEstimation = await this.simulate(sender, [contractMsg], memo)
    const multiplier = typeof fee === 'number' ? fee : 1.4
    // @ts-expect-error gasPrice is private
    return calculateFee(Math.round(gasEstimation * multiplier), this.gasPrice)
  }
}

export function useQueryingCosmWasmClient(rpcEndpoint: string) {
  const [client, setClient] = useState<CosmWasmClient>()

  useEffect(() => {
    CosmWasmClient.connect(rpcEndpoint).then((client) => {
      setClient(client)
    })
  }, [rpcEndpoint])

  return client
}

interface ClientState {
  client: SigningCosmWasmClient | null
  error: Error | null
  isLoading: boolean
}

export default function useSigningCosmWasmClient(
  chainName: string,
  gasPrice: string,
) {
  const { getRpcEndpoint, getOfflineSignerDirect } = useChain(chainName)

  const [state, setState] = useState<ClientState>({
    client: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!getRpcEndpoint) {
      return
    }

    getRpcEndpoint()
      .then(async (rpcEndpoint) => {
        const signer = getOfflineSignerDirect!()
        try {
          const client = await SigningCosmWasmClient.connectWithSigner(
            rpcEndpoint,
            signer,
            {
              gasPrice: GasPrice.fromString(gasPrice),
            },
          )
          setState({ client, error: null, isLoading: false })
        } catch (err) {
          setState({ client: null, error: err as Error, isLoading: false })
        }
      })
      .catch((err) => {
        setState({ client: null, error: err as Error, isLoading: false })
      })
  }, [gasPrice, getRpcEndpoint, getOfflineSignerDirect])

  return state
}
