import { ErrorKind, SubmitTxError } from '~/hooks/useSubmitTx'

export function SignError() {
  return (
    <div className="flex flex-col text-warning">
      <h2 className="text-xl font-semibold">Unable to sign transaction</h2>
      <span className="mt-4">
        You must sign and submit the transaction in order to inscribe content
      </span>
      <p className="mt-2 text-base-content">
        This may be a new account. Please send some tokens to this account
        first.
      </p>
    </div>
  )
}

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
      return message
    }
  }

  return message
}

export function EstimateError({ error }: { error: SubmitTxError }) {
  return (
    <div className="text-error">
      <h2 className="text-xl font-semibold">
        {getErrorKindMessage(error.kind)}
      </h2>
      <div className="mt-4">
        <h3 className="text-lg">Error details</h3>
        <pre className="whitespace-pre-wrap mt-4 text-sm">
          {getErrorDetails(error.kind, error.message)}
        </pre>
      </div>
    </div>
  )
}
