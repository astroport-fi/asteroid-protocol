import { ExecuteMsg } from '@asteroid-protocol/sdk/contracts'
import { useMemo } from 'react'
import { useExecuteBridgeMsg } from '~/hooks/useSubmitTx'
import Actions from '../SubmitTx/Actions'
import { TxBody } from '../SubmitTx/Body'
import Modal from './Modal'

interface Props {
  ticker: string
  amount: number
  destination: string
}

function NeutronTx({ ticker, amount, destination }: Props) {
  const msg: ExecuteMsg = useMemo(() => {
    return {
      send: {
        destination_addr: destination,
      },
    }
  }, [destination])

  const funds = useMemo(() => {
    return [
      { denom: ticker, amount: amount.toString() },
      { denom: 'untrn', amount: '1' },
    ]
  }, [ticker, amount])

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
        {/* <p className="mt-4">
          You are about to create a bridge inscription on the Cosmos Hub.
        </p> */}
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

function FromNeutronBridgeDialog({ ticker, amount, destination }: Props) {
  return (
    <Modal.Body className="text-center">
      <div className="mt-8">
        <NeutronTx ticker={ticker} amount={amount} destination={destination} />
      </div>
    </Modal.Body>
  )
}

export default FromNeutronBridgeDialog
