import type { TxInscription } from '@asteroid-protocol/sdk'
import { useLocation, useNavigate } from '@remix-run/react'
import { forwardRef, useEffect, useState } from 'react'
import type { To } from 'react-router'
import useForwardRef from '~/hooks/useForwardRef'
import useSubmitTx from '~/hooks/useSubmitTx'
import scanAnimationData from '~/lottie/scan.json'
import Lottie from '../Lottie'
import Actions from '../SubmitTx/Actions'
import Body from '../SubmitTx/Body'
import Modal from './Modal'

interface Props {
  txInscription: TxInscription | null
  resultCTA?: string
  resultLink?: To
  feeOperationTitle?: string
}

const TxDialog = forwardRef<HTMLDialogElement, Props>(function TxDialog(
  {
    txInscription: txInscriptionProp,
    resultCTA,
    resultLink,
    feeOperationTitle,
  },
  ref,
) {
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)
  const location = useLocation()

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

  useEffect(() => {
    if (txInscriptionProp != txInscription) {
      resetState()
      setTxInscription(txInscriptionProp)
    }
  }, [txInscriptionProp, txInscription, setTxInscription, resetState])

  return (
    <Modal
      ref={ref}
      backdrop
      onClose={() => {
        navigate(`${location.pathname}${location.search}`)
      }}
    >
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
            navigate(resultLink ?? `/app/inscription/${txHash}`)
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
          }}
          onRetry={retry}
        />
      </Modal.Actions>
    </Modal>
  )
})

export default TxDialog
