import { TxInscription } from '@asteroid-protocol/sdk'
import { getGrantSendMsg } from '@asteroid-protocol/sdk/msg'
import {
  CubeIcon,
  LockClosedIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import { Button } from 'react-daisyui'
import { LaunchpadDetail, StageDetail } from '~/api/launchpad'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useLaunchpadOperations } from '~/hooks/useOperations'
import TxDialog from './dialogs/TxDialog'
import { Wallet } from './wallet/Wallet'

function getActiveStage(stages: StageDetail[]) {
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
  const isEligible =
    activeStage == null ||
    !activeStage.has_whitelist ||
    activeStage.whitelists[0] != null

  const userReservations =
    activeStage?.reservations_aggregate.aggregate?.count ?? 0
  const reachedLimit =
    activeStage?.per_user_limit &&
    userReservations >= activeStage.per_user_limit

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
      {!operations ? (
        <Wallet className="btn-md w-full" color="primary" />
      ) : !activeStage ? (
        <Button
          disabled
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          No active stage
        </Button>
      ) : !isEligible ? (
        <Button
          disabled
          fullWidth
          startIcon={<LockClosedIcon className="size-4" />}
        >
          Not eligible
        </Button>
      ) : reachedLimit ? (
        <Button
          disabled
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          Reached per user limit
        </Button>
      ) : (
        <Button
          onClick={() => mint()}
          color="primary"
          fullWidth
          startIcon={<CubeIcon className="size-4" />}
        >
          Mint now
        </Button>
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
