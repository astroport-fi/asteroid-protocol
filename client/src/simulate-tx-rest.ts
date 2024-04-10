import { Pubkey } from '@cosmjs/amino'
import { toBase64 } from '@cosmjs/encoding'
import { EncodeObject, Registry, encodePubkey } from '@cosmjs/proto-signing'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeMessage(registry: Registry, message: any): unknown {
  if (ArrayBuffer.isView(message)) {
    return toBase64(message as Uint8Array)
  }

  if (Array.isArray(message)) {
    return message.map((item) => serializeMessage(registry, item))
  }

  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    if ('typeUrl' in message) {
      let serializedValue
      if (ArrayBuffer.isView(message.value)) {
        serializedValue = registry.decode(message)
      } else {
        serializedValue = message.value
      }

      if (typeof serializedValue === 'string') {
        return {
          '@type': message.typeUrl,
          value: serializedValue,
        }
      }

      return {
        ...(serializeMessage(registry, serializedValue) as Record<
          string,
          unknown
        >),
        '@type': message.typeUrl,
      }
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(message)) {
      result[key] = serializeMessage(registry, value)
    }
    return result
  }

  return message
}

function serializeMessages(
  registry: Registry,
  messages: readonly EncodeObject[],
) {
  return messages.map((message) => serializeMessage(registry, message))
}

export default async function simulateTxRest(
  endpoint: string,
  registry: Registry,
  messages: readonly EncodeObject[],
  memo: string | undefined,
  signer: Pubkey,
  sequence: number,
  nonCriticalExtensionOptions?: EncodeObject[],
): Promise<SimulateResponse> {
  const pubkey = encodePubkey(signer)
  const signDoc = {
    body: {
      messages: serializeMessages(registry, messages),
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
