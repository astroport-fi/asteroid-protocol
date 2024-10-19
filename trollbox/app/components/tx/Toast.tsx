import { ErrorKind, SubmitTxError } from '~/hooks/useSubmitTx'
import TxLink from '../TxLink'

export const TxLinkToast = ({
  txHash,
  text,
}: {
  txHash: string
  text: string
}) => (
  <div>
    <p>{text}</p>
    <TxLink className="mt-4" txHash={txHash} title="View on Mintscan" />
  </div>
)

function getErrorKindMessage(kind: ErrorKind) {
  switch (kind) {
    case ErrorKind.Validation:
      return 'Validation error'
    case ErrorKind.Estimation:
      return 'Unable to estimate transaction fees'
    case ErrorKind.Transaction:
      return 'Unable to submit transaction'
    case ErrorKind.Generic:
      return 'Unknown error'
  }
}

function getErrorDetails(kind: ErrorKind, message: string) {
  if (kind === ErrorKind.Estimation) {
    try {
      const { message: details } = JSON.parse(message)
      if (details.includes('insufficient funds')) {
        return 'You do not have enough funds to complete this transaction'
      }

      return details
    } catch (err) {
      if (message.includes('insufficient funds')) {
        return 'You do not have enough funds to complete this transaction'
      }
      return message
    }
  }

  return message
}

export const ErrorToast = ({ error }: { error: SubmitTxError }) => (
  <div>
    <h2 className="text-lg font-semibold">{getErrorKindMessage(error.kind)}</h2>
    <pre className="whitespace-pre-wrap mt-2 text-sm">
      {getErrorDetails(error.kind, error.message)}
    </pre>
  </div>
)
