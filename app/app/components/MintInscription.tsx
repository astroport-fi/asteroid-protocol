import { TxInscription } from '@asteroid-protocol/sdk'
import { getGrantSendMsg } from '@asteroid-protocol/sdk/msg'
import { Button } from 'react-daisyui'
import { LaunchpadDetail } from '~/api/launchpad'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useLaunchpadOperations } from '~/hooks/useOperations'
import TxDialog from './dialogs/TxDialog'
import { Wallet } from './wallet/Wallet'

export default function MintInscription({
  launchpad,
  className,
}: {
  launchpad: LaunchpadDetail
  className?: string
}) {
  const { minterAddress } = useRootContext()
  const operations = useLaunchpadOperations()
  const { dialogRef, value, showDialog } =
    useDialogWithValue<TxInscription | null>()

  function mint() {
    if (!operations) {
      console.warn('No address')
      showDialog(null)
      return
    }

    // @todo stage id
    const txInscription = operations.reserve(launchpad.transaction.hash, 1)

    // @todo add payment for minting inscription based on stage
    const grant = getGrantSendMsg(operations.address, minterAddress, {
      allowList: [operations.address],
      spendLimit: [{ denom: 'uatom', amount: '1' }],
    })
    txInscription.messages = [grant]

    showDialog(txInscription)
  }

  return (
    <div className={className}>
      {operations ? (
        <Button onClick={() => mint()} color="primary" fullWidth>
          Mint now
        </Button>
      ) : (
        <Wallet className="btn-md w-full" color="primary" />
      )}
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultCTA="Back to mint"
        resultLink={`/app/launchpad/${launchpad.collection.symbol}`}
      />
    </div>
  )
}
