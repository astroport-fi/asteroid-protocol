import { Button } from 'react-daisyui'
import { TxState } from '~/hooks/useSubmitTx'

interface ActionsProps {
  txState: TxState
  txHash: string | null
  error: string | null
  onRetry: () => void
  onClose: () => void
  onSubmit: () => void
}

export default function Actions({
  txHash,
  txState,
  error,
  onSubmit,
  onClose,
  onRetry,
}: ActionsProps) {
  return (
    <form method="dialog" className="flex flex-col">
      {!txHash && !error && (
        <Button
          type="button"
          color="primary"
          className="mb-4"
          loading={txState != TxState.Initial}
          onClick={() => onSubmit()}
        >
          Continue
        </Button>
      )}
      {error && (
        <Button
          type="button"
          color="primary"
          className="mb-4"
          onClick={() => {
            onRetry()
          }}
        >
          Retry
        </Button>
      )}
      <Button
        className="no-underline"
        variant="link"
        onClick={() => {
          onClose()
        }}
      >
        Close
      </Button>
    </form>
  )
}
