import { Link } from '@remix-run/react'
import clsx from 'clsx'
import { Button } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { Token, isTokenLaunched } from '~/api/token'
import useDialog from '~/hooks/useDialog'
import { getDecimalValue } from '~/utils/number'
import SellTokenDialog from './dialogs/SellTokenDialog'
import TransferTokenDialog from './dialogs/TransferTokenDialog'

interface Props {
  token: Token
  amount?: number
  className?: string
}

export function TokenActions({ amount, token, className }: Props) {
  const { dialogRef: transferDialogRef, handleShow: showTransferDialog } =
    useDialog()
  const { dialogRef: sellDialogRef, handleShow: showSellDialog } = useDialog()

  const isLaunched = isTokenLaunched(token)

  return (
    <div className={twMerge('flex flex-row', className)}>
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
        className={clsx('btn btn-primary ml-2', {
          'btn-disabled': !isLaunched,
        })}
        to={`/app/market/${token.ticker}`}
      >
        Trade
      </Link>
      <TransferTokenDialog token={token} ref={transferDialogRef} />
      <SellTokenDialog
        ticker={token.ticker}
        tokenAmount={amount ?? 0}
        ref={sellDialogRef}
        lastPrice={getDecimalValue(token.last_price_base, token.decimals)}
      />
    </div>
  )
}
