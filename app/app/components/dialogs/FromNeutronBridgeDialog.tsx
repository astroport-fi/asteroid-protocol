import { ExecuteMsg } from '@asteroid-protocol/sdk/contracts'
import { useMemo } from 'react'
import { Token } from '~/api/token'
import { useExecuteBridgeMsg } from '~/hooks/useSubmitTx'
import { toDecimalValue } from '~/utils/number'
import Actions from '../SubmitTx/Actions'
import { TxBody } from '../SubmitTx/Body'
import Modal from './Modal'

interface Props {
  denom: string
  amount: number
  destination: string
  token: Token
}

function NeutronTx({ token, denom, amount, destination }: Props) {
  const msg: ExecuteMsg = useMemo(() => {
    return {
      send: {
        destination_addr: destination,
      },
    }
  }, [destination])

  const funds = useMemo(() => {
    return [
      { denom, amount: `${toDecimalValue(amount, token.decimals)}` },
      { denom: 'untrn', amount: '2001' }, // @todo where to get this value?
    ]
  }, [denom, amount, token.decimals])

  const { chainFee, error, txHash, txState, sendTx } = useExecuteBridgeMsg(
    msg,
    '',
    'auto',
    funds,
  )

  return (
    <>
      <TxBody
        chainFee={chainFee}
        error={error}
        txHash={txHash}
        txState={txState}
      >
        <h2 className="text-xl font-semibold">
          Sign and submit bridge transaction to Neutron
        </h2>
      </TxBody>
      <Modal.Actions className="flex justify-center">
        <Actions
          txState={txState}
          txHash={txHash}
          error={error}
          onSubmit={sendTx}
          onClose={() => {}}
          onRetry={() => {}}
        />
      </Modal.Actions>
    </>
  )
}

function FromNeutronBridgeDialog({ token, denom, amount, destination }: Props) {
  return (
    <Modal.Body className="text-center">
      <div className="mt-8">
        <NeutronTx
          denom={denom}
          token={token}
          amount={amount}
          destination={destination}
        />
      </div>
    </Modal.Body>
  )
}

export default FromNeutronBridgeDialog
