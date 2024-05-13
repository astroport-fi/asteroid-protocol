import type { TxInscription } from '@asteroid-protocol/sdk'
import { useLocation, useNavigate } from '@remix-run/react'
import { forwardRef, useEffect, useState } from 'react'
import type { To } from 'react-router'
import useForwardRef from '~/hooks/useForwardRef'
import useSubmitTx, { TxState } from '~/hooks/useSubmitTx'
import scanAnimationData from '~/lottie/scan.json'
import Lottie from '../Lottie'
import Actions from '../SubmitTx/Actions'
import { InscriptionBody } from '../SubmitTx/Body'
import Modal from './Modal'

interface Props {
  txInscription: TxInscription | null
  resultCTA: string
  resultLink?: To | ((txHash: string) => To)
  feeOperationTitle?: string
  onSuccess?: (txHash: string) => void
}

const TxDialog = forwardRef<HTMLDialogElement, Props>(function TxDialog(
  {
    txInscription: txInscriptionProp,
    resultCTA,
    resultLink,
    feeOperationTitle,
    onSuccess,
  },
  ref,
) {
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)

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
  const fRef = useForwardRef(ref)

  const location = useLocation()
  const navigate = useNavigate()
  const [url, setUrl] = useState<To | undefined>()

  useEffect(() => {
    if (txInscriptionProp != txInscription) {
      resetState()
      setTxInscription(txInscriptionProp)
    }
  }, [txInscriptionProp, txInscription, setTxInscription, resetState])

  useEffect(() => {
    if (txState === TxState.Success && txHash) {
      onSuccess?.(txHash)
    }
  }, [txState, txHash])

  return (
    <Modal
      ref={ref}
      backdrop
      onClose={() => {
        navigate(url ?? `${location.pathname}${location.search}`)
      }}
    >
      <Modal.Body className="text-center">
        <InscriptionBody
          chainFee={chainFee}
          metaprotocolFee={metaprotocolFee}
          error={error}
          txHash={txHash}
          txState={txState}
          resultCTA={resultCTA}
          feeOperationTitle={feeOperationTitle}
          onCTAClick={() => {
            if (typeof resultLink === 'function') {
              setUrl(resultLink(txHash))
            } else {
              setUrl(resultLink ?? `${location.pathname}${location.search}`)
            }
            fRef.current?.close()
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
        </InscriptionBody>
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
