import { EncodeObject } from '@cosmjs/proto-signing'
import { MsgSendEncodeObject, MsgTransferEncodeObject } from '@cosmjs/stargate'
import { MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx.js'
import { Any } from 'cosmjs-types/google/protobuf/any'
import { SigningStargateClient } from '../client.js'
import { InscriptionContent, ProtocolFee } from '../metaprotocol/index.js'

export interface TxFee {
  protocol: ProtocolFee
  operation: string
}

export interface TxData {
  memo: string
  messages: readonly EncodeObject[]
  nonCriticalExtensionOptions: Any[]
}

export interface TxInscription {
  urn: string
  content: InscriptionContent | undefined
  fee: TxFee
  messages: readonly EncodeObject[] | undefined
}

export function prepareTx(
  senderAddress: string,
  urn: string,
  inscriptions: TxInscription[],
  useIbc = true,
): TxData {
  if (inscriptions.length < 1) {
    throw new Error('No inscription data have been provided')
  }

  const nonCriticalExtensionOptions: Any[] = []
  let msgs: EncodeObject[] = []
  const protocol = inscriptions[0].fee.protocol // NOTE: we support just one fee denom and fee receiver for now
  let fee = 0
  const isMultiOp = inscriptions.length > 1

  for (const inscription of inscriptions) {
    // nonCriticalExtensionOptions
    if (inscription.content || isMultiOp) {
      nonCriticalExtensionOptions.push({
        // This typeUrl isn't really important here as long as it is a type
        // that the chain recognizes it
        typeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
        value: MsgRevoke.encode(
          MsgRevoke.fromPartial({
            granter: inscription.content?.metadata ?? '',
            grantee: inscription.content?.data ?? '',
            msgTypeUrl: inscription.urn,
          }),
        ).finish(),
      })
    }

    // messages
    if (inscription.messages) {
      msgs = msgs.concat(inscription.messages)
    }

    // fee
    fee += parseInt(inscription.fee.operation)
  }

  if (fee > 0) {
    if (useIbc) {
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
