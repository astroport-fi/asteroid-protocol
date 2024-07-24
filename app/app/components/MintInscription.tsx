import { TxInscription } from '@asteroid-protocol/sdk'
import { getGrantSendMsg } from '@asteroid-protocol/sdk/msg'
import { Button } from 'react-daisyui'
import { LaunchpadDetail, Stage } from '~/api/launchpad'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useLaunchpadOperations } from '~/hooks/useOperations'
import TxDialog from './dialogs/TxDialog'
import { Wallet } from './wallet/Wallet'

function getActiveStage(stages: Stage[]) {
  const now = new Date()
  return stages.find(
    (stage) =>
      (!stage.start_date || new Date(stage.start_date) < now) &&
      (!stage.finish_date || new Date(stage.finish_date) > now),
  )
}

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
  const activeStage = getActiveStage(launchpad.stages)

  function mint() {
    if (!activeStage) {
      console.warn('No active stage')
      return
    }

    if (!operations) {
      console.warn('No address')
      showDialog(null)
      return
    }

    const txInscription = operations.reserve(
      launchpad.transaction.hash,
      activeStage.id,
    )

    const mintFee = 100000
    const fee = mintFee + (activeStage.price ?? 0)

    const grant = getGrantSendMsg(operations.address, minterAddress, {
      allowList: [],
      spendLimit: [{ denom: 'uatom', amount: `${fee}` }],
    })
    txInscription.messages = [grant]

    showDialog(txInscription)
  }

  return (
    <div className={className}>
      {!activeStage ? (
        <Button disabled fullWidth>
          No active stage
        </Button>
      ) : operations ? (
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
