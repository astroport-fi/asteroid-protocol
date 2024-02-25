import { toBase64, toUtf8 } from '@cosmjs/encoding'
import { EncodeObject } from '@cosmjs/proto-signing'
import { MsgSendEncodeObject, MsgTransferEncodeObject } from '@cosmjs/stargate'
import { MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx.js'
import { SigningStargateClient } from '../client.js'
import { InscriptionData, ProtocolFee } from '../metaprotocol/index.js'
import { ExtensionData } from '../proto-types/extensions.js'
import { Inscription } from '../proto-types/inscription.js'

export interface TxFee {
  protocol: ProtocolFee
  operation: string
}

export interface TxData {
  memo: string
  messages: readonly EncodeObject[]
  nonCriticalExtensionOptions: EncodeObject[]
}

export interface TxInscription {
  protocolName: string
  protocolVersion: string
  urn: string
  data: InscriptionData | undefined
  fee: TxFee
  messages: readonly EncodeObject[] | undefined
}

function getMsgRevoke(inscription: TxInscription): MsgRevoke {
  if (inscription.data == null) {
    return {
      granter: '',
      grantee: '',
      msgTypeUrl: inscription.urn,
    }
  }

  const { data } = inscription

  const metadata = toBase64(
    toUtf8(
      JSON.stringify({
        metadata: data.metadata,
        parent: { type: data.parentType, identifier: data.parentIdentifier },
      }),
    ),
  )

  return {
    granter: toBase64(data.content),
    grantee: metadata,
    msgTypeUrl: inscription.urn,
  }
}

function getExtensionData(txInscription: TxInscription): ExtensionData {
  const data = txInscription.data!
  const inscription: Inscription = {
    content: data.content,
    metadata: toUtf8(JSON.stringify(data.metadata)),
    parentType: data.parentType,
    parentIdentifier: data.parentIdentifier,
  }

  return {
    protocolId: `asteroid:${txInscription.protocolName}`,
    protocolVersion: txInscription.protocolVersion.substring(1),
    data: Inscription.toProto(inscription),
  }
}

interface PrepareTxOptions {
  useIbc?: boolean
  useExtensionData?: boolean
}

const DEFAULT_OPTIONS: PrepareTxOptions = {
  useIbc: true,
  useExtensionData: false,
}

export function prepareTx(
  senderAddress: string,
  urn: string,
  inscriptions: TxInscription[],
  options: PrepareTxOptions = {},
): TxData {
  if (inscriptions.length < 1) {
    throw new Error('No inscription data have been provided')
  }

  options = { ...DEFAULT_OPTIONS, ...options }

  const nonCriticalExtensionOptions: EncodeObject[] = []
  let msgs: EncodeObject[] = []
  const protocol = inscriptions[0].fee.protocol // NOTE: we support just one fee denom and fee receiver for now
  let fee = 0
  const isMultiOp = inscriptions.length > 1

  for (const inscription of inscriptions) {
    // nonCriticalExtensionOptions
    if (inscription.data || isMultiOp) {
      if (options.useExtensionData) {
        nonCriticalExtensionOptions.push({
          typeUrl: ExtensionData.typeUrl,
          value: getExtensionData(inscription),
        })
      } else {
        nonCriticalExtensionOptions.push({
          typeUrl: MsgRevoke.typeUrl,
          value: getMsgRevoke(inscription),
        })
      }
    }

    // messages
    if (inscription.messages) {
      msgs = msgs.concat(inscription.messages)
    }

    // fee
    fee += parseInt(inscription.fee.operation)
  }

  if (fee > 0) {
    if (options.useIbc) {
      const timeoutTime = (new Date().getTime() + 60 * 60 * 1000) * 1000000

      const feeMessage: MsgTransferEncodeObject = {
        typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
        value: {
          receiver: protocol.receiver,
          sender: senderAddress,
          sourceChannel: protocol.ibcChannel,
          sourcePort: 'transfer',
          timeoutTimestamp: BigInt(timeoutTime),
          timeoutHeight: {
            revisionNumber: BigInt(0),
            revisionHeight: BigInt(0),
          },
          memo: '',
          token: {
            amount: fee.toFixed(0),
            denom: protocol.denom,
          },
        },
      }
      msgs.push(feeMessage)
    } else {
      const feeMessage: MsgSendEncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: senderAddress,
          toAddress: protocol.receiver,
          amount: [
            {
              amount: fee.toFixed(0),
              denom: protocol.denom,
            },
          ],
        },
      }
      msgs.push(feeMessage)
    }
  } else if (msgs.length == 0) {
    // If no fee is charged, we need to send the smallest amount possible
    // to the sender to create a valid transaction
    // For the Hub that would be 0.000001 ATOM or 1uatom
    // We only do this if there are no messages present
    const feeMessage: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: senderAddress,
        toAddress: senderAddress,
        amount: [
          {
            amount: '1',
            denom: protocol.denom,
          },
        ],
      },
    }
    msgs.push(feeMessage)
  }

  return {
    memo: urn,
    messages: msgs,
    nonCriticalExtensionOptions,
  }
}

export function broadcastTx(
  client: SigningStargateClient,
  address: string,
  txData: TxData,
) {
  return client.signAndBroadcast(
    address,
    txData.messages,
    'auto',
    txData.memo,
    undefined,
    txData.nonCriticalExtensionOptions,
  )
}
