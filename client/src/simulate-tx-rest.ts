import { Pubkey } from '@cosmjs/amino'
import { encodePubkey } from '@cosmjs/proto-signing'
import { SimulateResponse } from 'cosmjs-types/cosmos/tx/v1beta1/service.js'
import { Any } from 'cosmjs-types/google/protobuf/any.js'

export const api = <T>(url: string, init?: RequestInit): Promise<T> => {
  return fetch(url, init).then((response) => {
    if (!response.ok) {
      console.error('error response', response)
      throw new Error(response.statusText)
    }
    return response.json() as Promise<T>
  })
}

export interface GasSimulateResponse {
  gas_info: GasInfo
}

export interface GasInfo {
  gas_wanted: string
  gas_used: string
}

export default async function simulateTxRest(
  endpoint: string,
  messages: readonly Any[],
  memo: string | undefined,
  signer: Pubkey,
  sequence: number,
  nonCriticalExtensionOptions?: Any[],
): Promise<SimulateResponse> {
  const pubkey = encodePubkey(signer)
  const signDoc = {
    body: {
      messages: messages.map((message) => ({
        ...message.value,
        '@type': message.typeUrl,
      })),
      memo,
      timeout_height: '0',
      extension_options: [],
      nonCriticalExtensionOptions: nonCriticalExtensionOptions?.map(
        (message) => ({
          ...message.value,
          '@type': message.typeUrl,
        }),
      ),
    },
    auth_info: {
      signer_infos: [
        {
          public_key: {
            '@type': pubkey.typeUrl,
            key: Buffer.from(pubkey.value).toString('base64'),
          },
          mode_info: {
            single: {
              mode: 'SIGN_MODE_DIRECT',
            },
          },
          sequence: sequence,
        },
      ],
      fee: {},
    },
  }

  const tx = {
    tx: {
      body: signDoc.body,
      auth_info: signDoc.auth_info,
      signatures: [
        '8jXh7aU3pIE07HBva+W/GLEO0xc5QMu5EXR6hglL2fFVP8AXsMbiNR5Et8POJXJZLWE58wc1ni8rzxF7d/cv5g==',
      ], // Locally generated, doesn't matter
    },
  }

  const call = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tx, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value,
    ),
  }
  const uri = `${endpoint}/cosmos/tx/v1beta1/simulate`

  const response = await api<GasSimulateResponse>(uri, call)
  return {
    gasInfo: {
      gasWanted: BigInt(response.gas_info.gas_wanted),
      gasUsed: BigInt(response.gas_info.gas_used),
    },
  }
}
