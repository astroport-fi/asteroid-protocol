import { Pubkey } from '@cosmjs/amino'
import { encodePubkey } from '@cosmjs/proto-signing'
import { QueryClient, createProtobufRpcClient } from '@cosmjs/stargate'
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js'
import {
  GetTxRequest,
  GetTxResponse,
  ServiceClientImpl,
  SimulateRequest,
  SimulateResponse,
} from 'cosmjs-types/cosmos/tx/v1beta1/service.js'
import { AuthInfo, Fee, Tx, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
import { Any } from 'cosmjs-types/google/protobuf/any.js'

export interface TxExtension {
  readonly tx: {
    getTx: (txId: string) => Promise<GetTxResponse>
    simulate: (
      messages: readonly Any[],
      memo: string | undefined,
      signer: Pubkey,
      sequence: number,
      nonCriticalExtensionOptions?: Any[],
    ) => Promise<SimulateResponse>
  }
}

export function setupTxExtension(base: QueryClient): TxExtension {
  // Use this service to get easy typed access to query methods
  // This cannot be used for proof verification
  const rpc = createProtobufRpcClient(base)
  const queryService = new ServiceClientImpl(rpc)

  return {
    tx: {
      getTx: async (txId: string) => {
        const request: GetTxRequest = {
          hash: txId,
        }
        const response = await queryService.GetTx(request)
        return response
      },
      simulate: async (
        messages: readonly Any[],
        memo: string | undefined,
        signer: Pubkey,
        sequence: number,
        nonCriticalExtensionOptions?: Any[],
      ): Promise<SimulateResponse> => {
        const tx = Tx.fromPartial({
          authInfo: AuthInfo.fromPartial({
            fee: Fee.fromPartial({}),
            signerInfos: [
              {
                publicKey: encodePubkey(signer),
                sequence: BigInt(sequence),
                modeInfo: { single: { mode: SignMode.SIGN_MODE_UNSPECIFIED } },
              },
            ],
          }),
          body: TxBody.fromPartial({
            messages: Array.from(messages),
            memo: memo,
            nonCriticalExtensionOptions,
          }),
          signatures: [new Uint8Array()],
        })

        const request = SimulateRequest.fromPartial({
          txBytes: Tx.encode(tx).finish(),
        })
        const response = await queryService.Simulate(request)
        return response
      },
    },
  }
}
