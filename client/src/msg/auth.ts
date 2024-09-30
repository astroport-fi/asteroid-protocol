import { EncodeObject } from '@cosmjs/proto-signing'
import {
  MsgExec,
  MsgGrant,
  MsgRevoke,
} from 'cosmjs-types/cosmos/authz/v1beta1/tx.js'
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz.js'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx.js'

export function getGrantSendMsg(
  granter: string,
  grantee: string,
  authorization: SendAuthorization,
): EncodeObject {
  const grant: MsgGrant = {
    granter,
    grantee,
    grant: {
      authorization: {
        typeUrl: SendAuthorization.typeUrl,
        value: SendAuthorization.encode(authorization).finish(),
      },
    },
  }

  return {
    typeUrl: MsgGrant.typeUrl,
    value: grant,
  }
}

export function getRevokeSendMsg(granter: string, grantee: string) {
  const revoke: MsgRevoke = {
    grantee,
    granter,
    msgTypeUrl: MsgSend.typeUrl,
  }
  return {
    typeUrl: MsgRevoke.typeUrl,
    value: revoke,
  }
}

export function getExecSendGrantMsg(
  grantee: string,
  msg: MsgSend,
): EncodeObject {
  const exec: MsgExec = {
    grantee,
    msgs: [
      {
        typeUrl: MsgSend.typeUrl,
        value: MsgSend.encode(msg).finish(),
      },
    ],
  }

  return {
    typeUrl: MsgExec.typeUrl,
    value: exec,
  }
}
