import { TxData } from '@asteroid-protocol/sdk'
import { useNavigate } from '@remix-run/react'
import { forwardRef } from 'react'
import { Modal } from 'react-daisyui'
import type { To } from 'react-router'
import useForwardRef from '~/hooks/useForwardRef'
import useSubmitTx from '~/hooks/useSubmitTx'
import Actions from '../SubmitTx/Actions'
import Body from '../SubmitTx/Body'

interface Props {
  txData: TxData | null
  resultCTA?: string
  resultLink?: To
}

const TxDialog = forwardRef<HTMLDialogElement, Props>(function TxDialog(
  { txData, resultCTA, resultLink },
  ref,
) {
  const { chainFee, error, txState, txHash, sendTx, resetState, retry } =
    useSubmitTx(txData)
  const navigate = useNavigate()
  const fRef = useForwardRef(ref)

  return (
    <Modal ref={ref}>
      <Modal.Body className="text-center">
        <Body
          chainFee={chainFee}
          error={error}
          txHash={txHash}
          txState={txState}
          resultCTA={resultCTA}
          onClose={() => {
            fRef.current?.close()
            navigate(resultLink ?? `/inscription/${txHash}`)
            resetState()
          }}
        >
          <h2 className="text-xl font-semibold">Sign and submit transaction</h2>
          <p className="mt-4">
            You are about to inscribe permanently on the Cosmos Hub.
          </p>
          <span>
            This can <strong>not</strong>
            {` `}be undone.
          </span>
        </Body>
      </Modal.Body>
      <Modal.Actions className="flex justify-center">
        <Actions
          txState={txState}
          txHash={txHash}
          error={error}
          onSubmit={sendTx}
          onClose={() => {
            fRef.current?.close()
            resetState()
          }}
          onRetry={retry}
        />
      </Modal.Actions>
    </Modal>
  )
})

export default TxDialog
