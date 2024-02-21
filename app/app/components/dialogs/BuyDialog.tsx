import { TxInscription } from '@asteroid-protocol/sdk'
import { useNavigate } from '@remix-run/react'
import { forwardRef, useEffect, useState } from 'react'
import { Modal, Steps } from 'react-daisyui'
import type { To } from 'react-router'
import useForwardRef from '~/hooks/useForwardRef'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import useSubmitTx, { TxState } from '~/hooks/useSubmitTx'
import Actions from '../SubmitTx/Actions'
import Body from '../SubmitTx/Body'

export type BuyType = 'cft20' | 'inscription'

interface Props {
  listingHash: string | null
  buyType: BuyType
  resultLink: To
}

enum Step {
  Initial,
  Reserve,
  Purchase,
}

// @todo add fee breakdown details
const BuyDialog = forwardRef<HTMLDialogElement, Props>(function BuyDialog(
  { buyType, listingHash: listingHashProp, resultLink },
  ref,
) {
  const operations = useMarketplaceOperations()

  const [listingHash, setListingHash] = useState<string | null>(null)
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)

  useEffect(() => {
    if (listingHashProp) {
      setListingHash(listingHashProp)
    }
  }, [listingHashProp, setListingHash])

  const [step, setStep] = useState(Step.Initial)
  const {
    chainFee,
    metaprotocolFee,
    error,
    txState,
    txHash,
    sendTx,
    resetState: resetTxState,
    retry,
  } = useSubmitTx(txInscription)

  function resetState() {
    setListingHash(null)
    setStep(Step.Initial)
    resetTxState()
  }

  useEffect(() => {
    if (!listingHash || !operations) {
      return
    }

    if (step === Step.Initial && txState === TxState.Initial) {
      setStep(Step.Reserve)
      operations.deposit(listingHash).then(setTxInscription)
    } else if (step === Step.Reserve && txState === TxState.SuccessInscribed) {
      operations.buy(listingHash, buyType).then((buyTxData) => {
        setTxInscription(buyTxData)
        setStep(Step.Purchase)
        resetTxState()
      })
    }
  }, [listingHash, buyType, operations, step, txState, resetTxState])

  const navigate = useNavigate()
  const fRef = useForwardRef(ref)

  return (
    <Modal ref={ref}>
      <Modal.Body className="text-center">
        <Body
          chainFee={chainFee}
          metaprotocolFee={metaprotocolFee}
          error={error}
          txHash={txHash}
          txState={txState}
          feeOperationTitle={
            step === Step.Purchase ? 'Inscription price' : 'Deposit (0.01%)'
          }
          resultCTA="Back to market"
          onClose={
            step === Step.Purchase
              ? () => {
                  fRef.current?.close()
                  navigate(resultLink)
                  resetState()
                }
              : undefined
          }
        >
          <Steps className="w-full">
            <Steps.Step color="primary">Reserve</Steps.Step>
            <Steps.Step color={step === Step.Purchase ? 'primary' : undefined}>
              Purchase
            </Steps.Step>
          </Steps>

          <p className="mt-6">
            The two-step buying process requires a small deposit to reserve the
            tokens for purchase. Deposits are final and can&apos;t be refunded.
            If you don&apos;t complete the purchase, the deposit will be lost.
          </p>
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

export default BuyDialog
