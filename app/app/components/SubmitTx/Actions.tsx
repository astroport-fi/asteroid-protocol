import { Button } from 'react-daisyui'
import { useRootContext } from '~/context/root'
import { SubmitTxError, TxState } from '~/hooks/useSubmitTx'
import useChain from '~/hooks/wallet/useChain'
import { Wallet } from '../wallet/Wallet'

interface ActionsProps {
  chainName?: string
  txState: TxState
  txHash: string | null
  error: SubmitTxError | null
  confirmText?: string
  disabled?: boolean
  onRetry: () => void
  onClose: () => void
  onSubmit: () => void
}

export default function Actions({
  txHash,
  txState,
  error,
  confirmText = 'Continue',
  disabled,
  chainName,
  onSubmit,
  onClose,
  onRetry,
}: ActionsProps) {
  const { chainName: cosmosHubChainName } = useRootContext()
  const chain = useChain(chainName ?? cosmosHubChainName)
  const address = chain.address

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
          disabled={disabled}
          loading={txState != TxState.Initial}
          onClick={() => onSubmit()}
        >
          {confirmText}
        </Button>
      )
    }
  } else {
    button = <Wallet chainName={chainName} className="btn-md" />
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
