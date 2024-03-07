import { ErrorKind, SubmitTxError } from '~/hooks/useSubmitTx'

export function SignError() {
  return (
    <div className="text-warning">
      <h2 className="text-xl font-semibold">Unable to sign transaction</h2>
      <p className="mt-4">
        This may be a new account. Please send some tokens to this account
        first.
      </p>
      <span className="mt-4">
        You must sign and submit the transaction in order to inscribe content
      </span>
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

export function EstimateError({ error }: { error: SubmitTxError }) {
  return (
    <div className="text-error">
      <h2 className="text-xl font-semibold">
        {getErrorKindMessage(error.kind)}
      </h2>
      <p className="mt-4">Error details: {error.message}</p>
    </div>
  )
}
