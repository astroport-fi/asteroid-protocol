import { Button } from 'react-daisyui'
import { TxState } from '~/hooks/useSubmitTx'
import TxLink from '../TxLink'

interface TxStatusProps {
  resultCTA?: string
  txHash?: string
  txState: TxState
  txError: string | null
  onClose?: () => void
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

export default function TxStatus({
  resultCTA,
  txHash,
  txState,
  txError,
  onClose,
}: TxStatusProps) {
  let title = ''
  let description = ''
  let headerColor = 'text-base-content'

  if (txState == TxState.Failed) {
    headerColor = 'text-error'
    title = 'Inscription failed'
    description =
      'Your inscription was created on-chain, but failed to be added to Asteroid.'
  } else if (txState == TxState.SuccessInscribed) {
    headerColor = 'text-success'
    title = 'Transaction complete'
    description = 'Your inscription is now on-chain and viewable on Asteroid'
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
      <h2 className={`text-xl font-semibold ${headerColor}`}>{title}</h2>
      <p className="mt-4">{description}</p>
      {txState == TxState.Failed && txError && (
        <p className="text-error">{txErrorToText(txError)}</p>
      )}
      {typeof onClose === 'function' && txState == TxState.SuccessInscribed && (
        <Button color="primary" className="mt-8" onClick={() => onClose()}>
          {resultCTA ?? 'View inscription'}
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
