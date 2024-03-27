import { Pubkey } from '@cosmjs/amino'
import { toBase64 } from '@cosmjs/encoding'
import { EncodeObject, encodePubkey } from '@cosmjs/proto-signing'
import { SimulateResponse } from 'cosmjs-types/cosmos/tx/v1beta1/service.js'
import { ExtensionData } from './proto-types/extensions.js'

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, init)
    if (!response.ok) {
      const text = await response.text()
      console.error('error response', text)
      throw new Error(text)
    }
    return response.json()
  } catch (err) {
    console.error('request error', err)
    throw err
  }
}

export interface GasSimulateResponse {
  gas_info: GasInfo
}

export interface GasInfo {
  gas_wanted: string
  gas_used: string
}

function serializeExtensionData(msg: EncodeObject) {
  const { protocolId, protocolVersion, data } = msg.value as ExtensionData
  return {
    '@type': msg.typeUrl,
    protocolId,
    protocolVersion,
    data: toBase64(data),
  }
}

function serializeNonCriticalOptions(msg: EncodeObject) {
  if (msg.typeUrl === ExtensionData.typeUrl) {
    return serializeExtensionData(msg)
  }
  return {
    ...msg.value,
    '@type': msg.typeUrl,
  }
}

export default async function simulateTxRest(
  endpoint: string,
  messages: readonly EncodeObject[],
  memo: string | undefined,
  signer: Pubkey,
  sequence: number,
  nonCriticalExtensionOptions?: EncodeObject[],
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
      non_critical_extension_options: nonCriticalExtensionOptions?.map(
        serializeNonCriticalOptions,
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
