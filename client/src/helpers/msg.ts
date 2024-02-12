import { MsgSendEncodeObject } from '@cosmjs/stargate'

export function createSendMessage(
  fromAddress: string,
  toAddress: string,
  denom: string,
  amount: string,
): MsgSendEncodeObject {
  return {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress,
      toAddress,
      amount: [
        {
          amount,
          denom,
        },
      ],
    },
  }
}
