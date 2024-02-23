import { Link } from '@remix-run/react'
import { Button } from 'react-daisyui'
import useDialog from '~/hooks/useDialog'
import { Token } from '~/services/asteroid'
import SellTokenDialog from './dialogs/SellTokenDialog'
import TransferTokenDialog from './dialogs/TransferTokenDialog'

interface Props {
  token: Token
  amount?: number
}

export function TokenActions({ amount, token }: Props) {
  const { dialogRef: transferDialogRef, handleShow: showTransferDialog } =
    useDialog()
  const { dialogRef: sellDialogRef, handleShow: showSellDialog } = useDialog()

  return (
    <div className="flex flex-col">
      <div className="flex flex-row mt-4">
        <Button
          color="primary"
          disabled={!amount}
          onClick={() => showTransferDialog()}
        >
          Send
        </Button>
        <Button
          className="ml-2"
          color="primary"
          disabled={!amount}
          onClick={() => showSellDialog()}
        >
          Sell
        </Button>
        <Link
          className="btn btn-primary ml-2"
          to={`/app/market/${token.ticker}`}
        >
          Trade
        </Link>
        <TransferTokenDialog token={token} ref={transferDialogRef} />
        <SellTokenDialog
          ticker={token.ticker}
          tokenAmount={amount ?? 0}
          ref={sellDialogRef}
        />
      </div>
    </div>
  )
}
