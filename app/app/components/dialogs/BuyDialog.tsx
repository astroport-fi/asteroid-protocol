import { TxData } from '@asteroid-protocol/sdk'
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
  { buyType, listingHash, resultLink },
  ref,
) {
  const operations = useMarketplaceOperations()

  const [txData, setTxData] = useState<TxData | null>(null)
  const [step, setStep] = useState(Step.Initial)
  const { chainFee, error, txState, txHash, sendTx, resetState, retry } =
    useSubmitTx(txData)

  useEffect(() => {
    if (!listingHash || !operations) {
      return
    }

    if (step === Step.Initial && txState === TxState.Initial) {
      console.log('set tx data: deposit')
      setStep(Step.Reserve)
      operations.deposit(listingHash).then(setTxData)
    } else if (step === Step.Reserve && txState === TxState.SuccessInscribed) {
      console.log('set tx data: buy')
      operations.buy(listingHash, buyType).then((buyTxData) => {
        setTxData(buyTxData)
        setStep(Step.Purchase)
        resetState()
      })
    }
  }, [listingHash, buyType, operations, step, txState, resetState])

  const navigate = useNavigate()
  const fRef = useForwardRef(ref)
  if (error) {
    console.log(error)
  }

  return (
    <Modal ref={ref}>
      <Modal.Body className="text-center">
        <Body
          chainFee={chainFee}
          error={error}
          txHash={txHash}
          txState={txState}
          resultCTA="Back to market"
          onClose={
            step === Step.Purchase
              ? () => {
                  fRef.current?.close()
                  navigate(resultLink)
                  resetState()
                  setStep(Step.Initial)
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
            setStep(Step.Initial)
          }}
          onRetry={retry}
        />
      </Modal.Actions>
    </Modal>
  )
})

export default BuyDialog
