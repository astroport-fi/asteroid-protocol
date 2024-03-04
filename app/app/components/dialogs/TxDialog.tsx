import type { TxInscription } from '@asteroid-protocol/sdk'
import { useNavigate } from '@remix-run/react'
import { forwardRef } from 'react'
import { Modal } from 'react-daisyui'
import type { To } from 'react-router'
import useForwardRef from '~/hooks/useForwardRef'
import useSubmitTx from '~/hooks/useSubmitTx'
import scanAnimationData from '~/lottie/scan.json'
import Lottie from '../Lottie'
import Actions from '../SubmitTx/Actions'
import Body from '../SubmitTx/Body'

interface Props {
  txInscription: TxInscription | null
  resultCTA?: string
  resultLink?: To
  feeOperationTitle?: string
}

const TxDialog = forwardRef<HTMLDialogElement, Props>(function TxDialog(
  { txInscription, resultCTA, resultLink, feeOperationTitle },
  ref,
) {
  const {
    chainFee,
    metaprotocolFee,
    error,
    txState,
    txHash,
    sendTx,
    resetState,
    retry,
  } = useSubmitTx(txInscription)
  const navigate = useNavigate()
  const fRef = useForwardRef(ref)

  return (
    <Modal ref={ref} backdrop>
      <Modal.Body className="text-center">
        <Body
          chainFee={chainFee}
          metaprotocolFee={metaprotocolFee}
          error={error}
          txHash={txHash}
          txState={txState}
          resultCTA={resultCTA}
          feeOperationTitle={feeOperationTitle}
          onClose={() => {
            fRef.current?.close()
            navigate(resultLink ?? `/app/inscription/${txHash}`)
            resetState()
          }}
        >
          <Lottie animationData={scanAnimationData} />
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
