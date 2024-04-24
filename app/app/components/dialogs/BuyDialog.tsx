import type { TxInscription } from '@asteroid-protocol/sdk'
import { useLocation, useNavigate } from '@remix-run/react'
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Steps } from 'react-daisyui'
import type { To } from 'react-router'
import { SWRResponse } from 'swr'
import { Royalty } from '~/api/client'
import { ListingState, getListingState } from '~/api/marketplace'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'
import useForwardRef from '~/hooks/useForwardRef'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import useSubmitTx, { ErrorKind, TxState } from '~/hooks/useSubmitTx'
import Actions from '../SubmitTx/Actions'
import Body from '../SubmitTx/Body'
import Modal from './Modal'

export type BuyType = 'cft20' | 'inscription'

interface Props {
  listingHash: string | string[] | null
  buyType: BuyType
  royalty?: SWRResponse<Royalty | null>
  resultLink?: To | ((txHash: string) => To)
  onSuccess?: (txHash: string) => void
}

enum Step {
  Initial,
  InitialBuy,
  Reserve,
  Purchase,
}

interface ListingsInfo {
  selectedListings: number
  operationListings: number
}

function getListingsInfo(
  buyType: BuyType,
  selectedListings: string | string[],
  operationListings: string[] | undefined,
): ListingsInfo {
  if (buyType === 'inscription') {
    return {
      operationListings: 1,
      selectedListings: 1,
    }
  }

  if (typeof selectedListings === 'string') {
    selectedListings = [selectedListings]
  }

  if (!operationListings) {
    return {
      operationListings: 1,
      selectedListings: selectedListings.length,
    }
  }

  return {
    selectedListings: selectedListings.length,
    operationListings: operationListings.length,
  }
}

const BuyDialog = forwardRef<HTMLDialogElement, Props>(function BuyDialog(
  { buyType, royalty, listingHash: listingHashProp, resultLink, onSuccess },
  ref,
) {
  const operations = useMarketplaceOperations()
  const address = useAddress()
  const {
    status: { lastKnownHeight },
  } = useRootContext()
  const location = useLocation()
  const navigate = useNavigate()
  const [url, setUrl] = useState<To | undefined>()

  const [listingHash, setListingHash] = useState<string | string[] | null>(null)
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)

  const [step, setStep] = useState(Step.Initial)
  const stepTitle = step === Step.Purchase ? 'Purchase' : 'Reserve'
  const {
    chainFee,
    metaprotocolFee,
    error,
    txState,
    txHash,
    sendTx,
    setError,
    resetState: resetTxState,
    retry,
  } = useSubmitTx(txInscription)
  const asteroidClient = useAsteroidClient()

  useEffect(() => {
    if (
      txState === TxState.SuccessInscribed &&
      step === Step.Purchase &&
      txHash
    ) {
      onSuccess?.(txHash)
    }
  }, [txState, txHash, step])

  const listingInfo = useMemo(() => {
    if (!listingHash) {
      return {
        selectedListings: 0,
        operationListings: 0,
      }
    }

    return getListingsInfo(
      buyType,
      listingHash,
      txInscription?.data?.metadata as string[] | undefined,
    )
  }, [listingHash, buyType, txInscription?.data?.metadata])

  const resetState = useCallback(() => {
    setListingHash(null)
    setTxInscription(null)
    setStep(Step.Initial)
    resetTxState()
  }, [resetTxState])

  useEffect(() => {
    if (listingHashProp && listingHashProp != listingHash) {
      resetState()
      asteroidClient
        .fetchListing(
          typeof listingHashProp === 'string'
            ? listingHashProp
            : listingHashProp[0],
        )
        .then((listing) => {
          if (listing) {
            const listingState = getListingState(
              listing,
              address,
              lastKnownHeight,
            )
            if (listingState === ListingState.Buy) {
              setStep(Step.InitialBuy)
            }
            setListingHash(listingHashProp)
          }
        })
    }
  }, [
    listingHashProp,
    listingHash,
    address,
    lastKnownHeight,
    asteroidClient,
    setListingHash,
    resetState,
  ])

  useEffect(() => {
    if (!listingHash || !operations) {
      return
    }

    if (step === Step.Initial && txState === TxState.Initial) {
      setStep(Step.Reserve)
      operations
        .deposit(listingHash)
        .then(setTxInscription)
        .catch((err: Error) =>
          setError({ kind: ErrorKind.Validation, message: err.message }),
        )
    } else if (step === Step.InitialBuy && txState === TxState.Initial) {
      operations
        .buy(listingHash, buyType, royalty?.data ?? undefined)
        .then((buyTxData) => {
          setTxInscription(buyTxData)
          setStep(Step.Purchase)
        })
        .catch((err: Error) =>
          setError({ kind: ErrorKind.Validation, message: err.message }),
        )
    } else if (step === Step.Reserve && txState === TxState.SuccessInscribed) {
      operations
        .buy(listingHash, buyType, royalty?.data ?? undefined)
        .then((buyTxData) => {
          setTxInscription(buyTxData)
          setStep(Step.Purchase)
          resetTxState()
        })
        .catch((err: Error) =>
          setError({ kind: ErrorKind.Validation, message: err.message }),
        )
    }
  }, [
    listingHash,
    buyType,
    royalty,
    operations,
    step,
    txState,
    resetTxState,
    setError,
  ])

  const fRef = useForwardRef(ref)

  return (
    <Modal
      ref={ref}
      backdrop
      onClose={() => navigate(url ?? `${location.pathname}${location.search}`)}
    >
      <Modal.Body className="text-center">
        <Body
          chainFee={chainFee}
          metaprotocolFee={metaprotocolFee}
          error={error}
          txHash={txHash}
          txState={txState}
          feeOperationTitle={
            step === Step.Purchase
              ? buyType === 'inscription'
                ? 'Inscription price'
                : 'Token listing price'
              : 'Deposit (0.01%)'
          }
          resultCTA="Back to market"
          onCTAClick={
            step === Step.Purchase
              ? () => {
                  if (typeof resultLink === 'function') {
                    setUrl(resultLink(txHash))
                  } else {
                    setUrl(
                      resultLink ?? `${location.pathname}${location.search}`,
                    )
                  }
                  fRef.current?.close()
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
          {step === Step.Purchase &&
            listingInfo.selectedListings !== listingInfo.operationListings && (
              <Alert className="border border-warning mt-4">
                <span>
                  You&apos;ve successfully reserved{' '}
                  {listingInfo.operationListings} out of{' '}
                  {listingInfo.selectedListings} listings
                </span>
              </Alert>
            )}
        </Body>
      </Modal.Body>
      <Modal.Actions className="flex justify-center">
        <Actions
          txState={txState}
          txHash={txHash}
          error={error}
          confirmText={
            listingInfo.operationListings > 1
              ? `${stepTitle} ${listingInfo.operationListings} listings`
              : stepTitle
          }
          disabled={royalty?.isLoading}
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

export default BuyDialog
