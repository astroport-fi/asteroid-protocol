import {
  StdFee,
  encodeSecp256k1Pubkey,
  makeSignDoc as makeSignDocAmino,
} from '@cosmjs/amino'
import { fromBase64 } from '@cosmjs/encoding'
import { Int53, Uint53 } from '@cosmjs/math'
import {
  EncodeObject,
  OfflineSigner,
  Registry,
  TxBodyEncodeObject,
  encodePubkey,
  isOfflineDirectSigner,
  makeAuthInfoBytes,
  makeSignDoc,
} from '@cosmjs/proto-signing'
import {
  AminoTypes,
  AuthExtension,
  BankExtension,
  DeliverTxResponse,
  GasPrice,
  HttpEndpoint,
  QueryClient,
  SignerData,
  SigningStargateClientOptions,
  StakingExtension,
  StargateClient,
  calculateFee,
  createDefaultAminoConverters,
  defaultRegistryTypes,
  setupAuthExtension,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate'
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc'
import { assert, assertDefined } from '@cosmjs/utils'
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
import { Any } from 'cosmjs-types/google/protobuf/any.js'
import { TxExtension, setupTxExtension } from './tx-extension.js'

export class SigningStargateClient extends StargateClient {
  public readonly registry: Registry
  public readonly broadcastTimeoutMs: number | undefined
  public readonly broadcastPollIntervalMs: number | undefined

  private readonly signer: OfflineSigner
  private readonly aminoTypes: AminoTypes
  private readonly gasPrice: GasPrice | undefined
  private readonly customQueryClient:
    | (QueryClient &
        AuthExtension &
        BankExtension &
        StakingExtension &
        TxExtension)
    | undefined

  /**
   * Creates an instance by connecting to the given CometBFT RPC endpoint.
   *
   * This uses auto-detection to decide between a CometBFT 0.38, Tendermint 0.37 and 0.34 client.
   * To set the Comet client explicitly, use `createWithSigner`.
   */
  public static async connectWithSigner(
    endpoint: string | HttpEndpoint,
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {},
  ): Promise<SigningStargateClient> {
    const cometClient = await connectComet(endpoint)
    return SigningStargateClient.createWithSigner(cometClient, signer, options)
  }

  /**
   * Creates an instance from a manually created Comet client.
   * Use this to use `Comet38Client` or `Tendermint37Client` instead of `Tendermint34Client`.
   */
  public static async createWithSigner(
    cometClient: CometClient,
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {},
  ): Promise<SigningStargateClient> {
    return new SigningStargateClient(cometClient, signer, options)
  }

  /**
   * Creates a client in offline mode.
   *
   * This should only be used in niche cases where you know exactly what you're doing,
   * e.g. when building an offline signing application.
   *
   * When you try to use online functionality with such a signer, an
   * exception will be raised.
   */
  public static async offline(
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {},
  ): Promise<SigningStargateClient> {
    return new SigningStargateClient(undefined, signer, options)
  }

  protected constructor(
    cometClient: CometClient | undefined,
    signer: OfflineSigner,
    options: SigningStargateClientOptions,
  ) {
    super(cometClient, options)
    const {
      registry = new Registry(defaultRegistryTypes),
      aminoTypes = new AminoTypes(createDefaultAminoConverters()),
    } = options
    this.registry = registry
    this.aminoTypes = aminoTypes
    this.signer = signer
    this.broadcastTimeoutMs = options.broadcastTimeoutMs
    this.broadcastPollIntervalMs = options.broadcastPollIntervalMs
    this.gasPrice = options.gasPrice

    if (cometClient) {
      this.customQueryClient = QueryClient.withExtensions(
        cometClient,
        setupAuthExtension,
        setupBankExtension,
        setupStakingExtension,
        setupTxExtension,
      )
    }
  }

  protected forceGetQueryClient(): QueryClient &
    AuthExtension &
    BankExtension &
    StakingExtension &
    TxExtension {
    if (!this.customQueryClient) {
      throw new Error(
        'Query client not available. You cannot use online functionality in offline mode.',
      )
    }
    return this.customQueryClient
  }

  public async simulate(
    signerAddress: string,
    messages: readonly EncodeObject[],
    memo: string | undefined,
    nonCriticalExtensionOptions?: Any[],
  ): Promise<number> {
    const anyMsgs = messages.map((m) => this.registry.encodeAsAny(m))
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    )
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer')
    }
    const pubkey = encodeSecp256k1Pubkey(accountFromSigner.pubkey)
    const { sequence } = await this.getSequence(signerAddress)
    const { gasInfo } = await this.forceGetQueryClient().tx.simulate(
      anyMsgs,
      memo,
      pubkey,
      sequence,
      nonCriticalExtensionOptions,
    )
    assertDefined(gasInfo)
    return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber()
  }

  public async estimate(
    signerAddress: string,
    messages: readonly EncodeObject[],
    memo: string | undefined,
    nonCriticalExtensionOptions?: Any[],
    fee: StdFee | 'auto' = 'auto',
  ) {
    assertDefined(
      this.gasPrice,
      'Gas price must be set in the client options when auto gas is used.',
    )
    const gasEstimation = await this.simulate(
      signerAddress,
      messages,
      memo,
      nonCriticalExtensionOptions,
    )
    // Starting with Cosmos SDK 0.47, we see many cases in which 1.3 is not enough anymore
    // E.g. https://github.com/cosmos/cosmos-sdk/issues/16020
    const multiplier = typeof fee === 'number' ? fee : 1.4
    return calculateFee(Math.round(gasEstimation * multiplier), this.gasPrice)
  }

  public async signAndBroadcast(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee | 'auto' | number,
    memo = '',
    timeoutHeight?: bigint,
    nonCriticalExtensionOptions?: Any[],
  ): Promise<DeliverTxResponse> {
    let usedFee: StdFee
    if (fee == 'auto' || typeof fee === 'number') {
      assertDefined(
        this.gasPrice,
        'Gas price must be set in the client options when auto gas is used.',
      )
      const gasEstimation = await this.simulate(
        signerAddress,
        messages,
        memo,
        nonCriticalExtensionOptions,
      )
      // Starting with Cosmos SDK 0.47, we see many cases in which 1.3 is not enough anymore
      // E.g. https://github.com/cosmos/cosmos-sdk/issues/16020
      const multiplier = typeof fee === 'number' ? fee : 1.4
      usedFee = calculateFee(
        Math.round(gasEstimation * multiplier),
        this.gasPrice,
      )
    } else {
      usedFee = fee
    }
    const txRaw = await this.sign(
      signerAddress,
      messages,
      usedFee,
      memo,
      undefined,
      timeoutHeight,
      nonCriticalExtensionOptions,
    )
    const txBytes = TxRaw.encode(txRaw).finish()
    return this.broadcastTx(
      txBytes,
      this.broadcastTimeoutMs,
      this.broadcastPollIntervalMs,
    )
  }

  /**
   * This method is useful if you want to send a transaction in broadcast,
   * without waiting for it to be placed inside a block, because for example
   * I would like to receive the hash to later track the transaction with another tool.
   * @returns Returns the hash of the transaction
   */
  public async signAndBroadcastSync(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee | 'auto' | number,
    memo = '',
    timeoutHeight?: bigint,
    nonCriticalExtensionOptions?: Any[],
  ): Promise<string> {
    let usedFee: StdFee
    if (fee == 'auto' || typeof fee === 'number') {
      assertDefined(
        this.gasPrice,
        'Gas price must be set in the client options when auto gas is used.',
      )
      const gasEstimation = await this.simulate(
        signerAddress,
        messages,
        memo,
        nonCriticalExtensionOptions,
      )
      const multiplier = typeof fee === 'number' ? fee : 1.3
      usedFee = calculateFee(
        Math.round(gasEstimation * multiplier),
        this.gasPrice,
      )
    } else {
      usedFee = fee
    }
    const txRaw = await this.sign(
      signerAddress,
      messages,
      usedFee,
      memo,
      undefined,
      timeoutHeight,
      nonCriticalExtensionOptions,
    )
    const txBytes = TxRaw.encode(txRaw).finish()
    return this.broadcastTxSync(txBytes)
  }

  /**
   * Gets account number and sequence from the API, creates a sign doc,
   * creates a single signature and assembles the signed transaction.
   *
   * The sign mode (SIGN_MODE_DIRECT or SIGN_MODE_LEGACY_AMINO_JSON) is determined by this client's signer.
   *
   * You can pass signer data (account number, sequence and chain ID) explicitly instead of querying them
   * from the chain. This is needed when signing for a multisig account, but it also allows for offline signing
   * (See the SigningStargateClient.offline constructor).
   */
  public async sign(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    explicitSignerData?: SignerData,
    timeoutHeight?: bigint,
    nonCriticalExtensionOptions?: Any[],
  ): Promise<TxRaw> {
    let signerData: SignerData
    if (explicitSignerData) {
      signerData = explicitSignerData
    } else {
      const { accountNumber, sequence } = await this.getSequence(signerAddress)
      const chainId = await this.getChainId()
      signerData = {
        accountNumber: accountNumber,
        sequence: sequence,
        chainId: chainId,
      }
    }

    return isOfflineDirectSigner(this.signer)
      ? this.signDirect(
          signerAddress,
          messages,
          fee,
          memo,
          signerData,
          timeoutHeight,
          nonCriticalExtensionOptions,
        )
      : this.signAmino(
          signerAddress,
          messages,
          fee,
          memo,
          signerData,
          timeoutHeight,
          nonCriticalExtensionOptions,
        )
  }

  private async signAmino(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint,
    nonCriticalExtensionOptions?: Any[],
  ): Promise<TxRaw> {
    assert(!isOfflineDirectSigner(this.signer))
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    )
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer')
    }
    const pubkey = encodePubkey(encodeSecp256k1Pubkey(accountFromSigner.pubkey))
    const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON
    const msgs = messages.map((msg) => this.aminoTypes.toAmino(msg))
    const signDoc = makeSignDocAmino(
      msgs,
      fee,
      chainId,
      memo,
      accountNumber,
      sequence,
      timeoutHeight,
    )
    const { signature, signed } = await this.signer.signAmino(
      signerAddress,
      signDoc,
    )
    const signedTxBody = {
      messages: signed.msgs.map((msg) => this.aminoTypes.fromAmino(msg)),
      memo: signed.memo,
      timeoutHeight: timeoutHeight,
      nonCriticalExtensionOptions,
    }
    const signedTxBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: signedTxBody,
    }
    const signedTxBodyBytes = this.registry.encode(signedTxBodyEncodeObject)
    const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber()
    const signedSequence = Int53.fromString(signed.sequence).toNumber()
    const signedAuthInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: signedSequence }],
      signed.fee.amount,
      signedGasLimit,
      signed.fee.granter,
      signed.fee.payer,
      signMode,
    )
    return TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    })
  }

  private async signDirect(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint,
    nonCriticalExtensionOptions?: Any[],
  ): Promise<TxRaw> {
    assert(isOfflineDirectSigner(this.signer))
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    )
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer')
    }
    const pubkey = encodePubkey(encodeSecp256k1Pubkey(accountFromSigner.pubkey))
    const txBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: messages,
        memo: memo,
        timeoutHeight: timeoutHeight,
        nonCriticalExtensionOptions,
      },
    }
    const txBodyBytes = this.registry.encode(txBodyEncodeObject)
    const gasLimit = Int53.fromString(fee.gas).toNumber()
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence }],
      fee.amount,
      gasLimit,
      fee.granter,
      fee.payer,
    )
    const signDoc = makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountNumber,
    )
    const { signature, signed } = await this.signer.signDirect(
      signerAddress,
      signDoc,
    )
    return TxRaw.fromPartial({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    })
  }
}
