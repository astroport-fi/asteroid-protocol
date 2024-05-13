import type { LottieOptions } from 'lottie-react'
import { Button } from 'react-daisyui'
import { SWRResponse } from 'swr'
import { SubmitTxError, TxState } from '~/hooks/useSubmitTx'
import errorAnimationData from '~/lottie/error.json'
import hourglassAnimationData from '~/lottie/hourglass.json'
import successAnimationData from '~/lottie/success.json'
import Lottie from '../Lottie'
import TxLink from '../TxLink'

interface TxStatusProps {
  txHash?: string
  txState: TxState
  txError: SubmitTxError | null
}

interface InscriptionTxStatusProps extends TxStatusProps {
  resultCTA?: string
  onCTAClick?: () => void
}

function txErrorToText(error: string) {
  if (error.includes('inscription_content_hash')) {
    return 'Your inscription contains content already inscribed. Duplicates are not allowed.'
  }
  if (error.includes('order by id') && error.includes("doesn't exist")) {
    return 'The sell order has already been filled or removed'
  }

  return error
}

export enum GenericStatusState {
  Loading,
  Success,
  Error,
}

export function GenericStatus({
  title,
  description,
  status,
  details,
  animationLoop = true,
}: {
  title: string
  description: string
  status: GenericStatusState
  animationLoop?: boolean
  details?: string
}) {
  let animationData: LottieOptions['animationData']
  let headerColor: string

  if (status == GenericStatusState.Success) {
    animationData = successAnimationData
    headerColor = 'text-success'
  } else if (status == GenericStatusState.Error) {
    animationData = errorAnimationData
    headerColor = 'text-error'
  } else {
    animationData = hourglassAnimationData
    headerColor = 'text-base-content'
  }

  return (
    <div className="flex flex-col items-center">
      <Lottie
        animationData={animationData}
        className="size-40"
        loop={animationLoop}
      />
      <h2 className={`text-xl font-semibold ${headerColor}`}>{title}</h2>
      <p className="mt-4">{description}</p>
      {details && <p className={headerColor}>{details}</p>}
    </div>
  )
}

export function SWRStatus({
  title,
  response,
}: {
  title: string
  response: SWRResponse
}) {
  if (response.isLoading) {
    return (
      <GenericStatus
        title={title}
        description="Fetching data from the server"
        status={GenericStatusState.Loading}
      />
    )
  }

  if (response.error) {
    return (
      <GenericStatus
        title={title}
        description="An error occurred while fetching data"
        details={response.error}
        status={GenericStatusState.Error}
      />
    )
  }

  if (response.data) {
    return (
      <GenericStatus
        title={title}
        description="Data fetched successfully"
        status={GenericStatusState.Success}
      />
    )
  }

  return null
}

export function InscriptionTxStatus({
  resultCTA,
  txHash,
  txState,
  txError,
  onCTAClick,
}: InscriptionTxStatusProps) {
  let title = ''
  let description = ''
  let headerColor = 'text-base-content'
  let animationData: LottieOptions['animationData'] = hourglassAnimationData
  let animationLoop = true

  if (txState == TxState.Failed) {
    headerColor = 'text-error'
    title = 'Inscription failed'
    description =
      'Your inscription was created on-chain, but failed to be added to Asteroid.'
    animationData = errorAnimationData
  } else if (txState == TxState.Success) {
    headerColor = 'text-success'
    title = 'Transaction complete'
    description = 'Your inscription is now on-chain and viewable on Asteroid'
    animationData = successAnimationData
    animationLoop = false
  } else if (
    txState == TxState.SuccessOnchain ||
    txState == TxState.SuccessIndexer
  ) {
    headerColor = 'text-info'
    title = 'Indexing'
    description =
      'Your inscription has been created on-chain, waiting for indexer'
  } else {
    title = 'Waiting for transaction'
    description =
      ' Your inscription has been submitted and waiting to be added to the next block'
  }

  return (
    <div className="flex flex-col items-center">
      <Lottie
        animationData={animationData}
        className="size-40"
        loop={animationLoop}
      />
      <h2 className={`text-xl font-semibold ${headerColor}`}>{title}</h2>
      <p className="mt-4">{description}</p>
      {txState == TxState.Failed && txError && (
        <p className="text-error">{txErrorToText(txError.message)}</p>
      )}
      {typeof onCTAClick === 'function' && txState == TxState.Success && (
        <Button color="primary" className="mt-8" onClick={() => onCTAClick()}>
          {resultCTA}
        </Button>
      )}
      {txHash && (
        <div className="flex flex-col bg-base-200 p-4 mt-4 rounded-xl">
          <strong>Transaction hash</strong>
          <span className="font-thin break-all mt-2">{txHash}</span>
          <TxLink className="mt-4" txHash={txHash} title="View on Mintscan" />
        </div>
      )}
    </div>
  )
}

export function TxStatus({ txState, txError }: TxStatusProps) {
  let title = ''
  let description = ''
  let animationLoop = true
  let state: GenericStatusState

  if (txState == TxState.Failed) {
    title = 'Inscription failed'
    description =
      'Your inscription was created on-chain, but failed to be added to Asteroid.'
    state = GenericStatusState.Error
  } else if (txState == TxState.Success) {
    title = 'Transaction complete'
    description = 'Your inscription is now on-chain and viewable on Asteroid'
    state = GenericStatusState.Success
    animationLoop = false
  } else {
    title = 'Waiting for transaction'
    description =
      ' Your transaction has been submitted and waiting to be added to the next block'
    state = GenericStatusState.Loading
  }

  return (
    <GenericStatus
      description={description}
      status={state}
      title={title}
      animationLoop={animationLoop}
      details={txError?.message}
    />
  )
}
