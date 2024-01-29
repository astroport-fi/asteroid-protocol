import { EncodeObject } from '@cosmjs/proto-signing'
import { MsgSendEncodeObject, MsgTransferEncodeObject } from '@cosmjs/stargate'
import { MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { Any } from 'cosmjs-types/google/protobuf/any'
import { SigningStargateClient } from '../client.js'
import { Inscription, ProtocolFee } from '../metaprotocol/index.js'

export interface TxFee {
  protocol: ProtocolFee
  operation: string
}

export interface TxData {
  memo: string
  messages: readonly EncodeObject[]
  nonCriticalExtensionOptions: Any[]
}

const USE_IBC = false

export function prepareTx(
  senderAddress: string,
  urn: string,
  inscription: Inscription | undefined,
  fee: TxFee,
  messages: readonly EncodeObject[] = [],
): TxData {
  let nonCriticalExtensionOptions: Any[] = []
  if (inscription) {
    nonCriticalExtensionOptions = [
      {
        // This typeUrl isn't really important here as long as it is a type
        // that the chain recognizes it
        typeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
        value: MsgRevoke.encode(
          MsgRevoke.fromPartial({
            granter: inscription.metadata,
            grantee: inscription.data,
            msgTypeUrl: urn,
          }),
        ).finish(),
      },
    ]
  }

  let msgs: EncodeObject[] = []
  if (messages.length > 0) {
    msgs = [...messages]
  }

  if (parseInt(fee.operation) > 0) {
    if (USE_IBC) {
      const timeoutTime = (new Date().getTime() + 60 * 60 * 1000) * 1000000

      const feeMessage: MsgTransferEncodeObject = {
        typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
        value: {
          receiver: fee.protocol.receiver,
          sender: senderAddress,
          sourceChannel: fee.protocol.ibcChannel,
          sourcePort: 'transfer',
          timeoutTimestamp: BigInt(timeoutTime),
          timeoutHeight: {
            revisionNumber: BigInt(0),
            revisionHeight: BigInt(0),
          },
          memo: '',
          token: {
            amount: fee.operation,
            denom: fee.protocol.denom,
          },
        },
      }
      msgs.push(feeMessage)
    } else {
      const feeMessage: MsgSendEncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: senderAddress,
          toAddress: senderAddress,
          amount: [
            {
              amount: fee.operation,
              denom: fee.protocol.denom,
            },
          ],
        },
      }
      msgs.push(feeMessage)
    }
  } else if (messages.length == 0) {
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
            denom: fee.protocol.denom,
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
