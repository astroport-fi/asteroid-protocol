import { Button } from 'react-daisyui'
import useAddress from '~/hooks/useAddress'
import { SubmitTxError, TxState } from '~/hooks/useSubmitTx'
import { Wallet } from '../wallet/Wallet'

interface ActionsProps {
  txState: TxState
  txHash: string | null
  error: SubmitTxError | null
  confirmText?: string
  onRetry: () => void
  onClose: () => void
  onSubmit: () => void
}

export default function Actions({
  txHash,
  txState,
  error,
  confirmText = 'Continue',
  onSubmit,
  onClose,
  onRetry,
}: ActionsProps) {
  const address = useAddress()

  let button: JSX.Element | undefined
  if (address) {
    if (error) {
      button = (
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
      )
    } else if (!txHash) {
      button = (
        <Button
          type="button"
          color="primary"
          className="mb-4"
          loading={txState != TxState.Initial}
          onClick={() => onSubmit()}
        >
          {confirmText}
        </Button>
      )
    }
  } else {
    button = <Wallet className="btn-md" />
  }

  return (
    <form method="dialog" className="flex flex-col">
      {button && button}
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
