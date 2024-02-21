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

export function EstimateError({ error }: { error: string }) {
  return (
    <div className="text-error">
      <h2 className="text-xl font-semibold">
        Unable to estimate transaction fees
      </h2>
      <p className="mt-4">Error details: {error}</p>
    </div>
  )
}
