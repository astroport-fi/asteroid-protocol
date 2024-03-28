import type { TxInscription } from '@asteroid-protocol/sdk'
import { Button } from 'react-daisyui'
import { TokenDetail } from '~/api/token'
import TxDialog from '~/components/dialogs/TxDialog'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useCFT20Operations } from '~/hooks/useOperations'
import { Wallet } from './wallet/Wallet'

export default function MintToken({
  className,
  token,
  showConnectWallet,
}: {
  token: TokenDetail
  className?: string
  showConnectWallet?: boolean
}) {
  const operations = useCFT20Operations()
  const { dialogRef, value, showDialog } =
    useDialogWithValue<TxInscription | null>()

  function mint() {
    if (!operations) {
      console.warn('No address')
      showDialog(null)
      return
    }

    const txInscription = operations.mint(token.ticker, token.per_mint_limit)

    showDialog(txInscription)
  }

  return (
    <div className={className}>
      {operations || !showConnectWallet ? (
        <Button onClick={() => mint()} color="primary">
          Mint now
        </Button>
      ) : (
        <Wallet className="btn-md" color="primary" />
      )}
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultCTA="Back to mint"
        resultLink={`/mint/${token.ticker}`}
      />
    </div>
  )
}
