import { Button } from 'react-daisyui'
import useAddress from '~/hooks/useAddress'
import { TxState } from '~/hooks/useSubmitTx'
import { Wallet } from '../wallet/Wallet'

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
          Continue
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
