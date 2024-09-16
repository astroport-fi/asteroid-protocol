import { TxInscription } from '@asteroid-protocol/sdk'
import { getGrantSendMsg } from '@asteroid-protocol/sdk/msg'
import {
  CheckIcon,
  CubeIcon,
  LockClosedIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import { Link } from '@remix-run/react'
import { useState } from 'react'
import { Alert, Button, Input } from 'react-daisyui'
import { LaunchpadDetail, StageDetail } from '~/api/launchpad'
import { useRootContext } from '~/context/root'
import useAtomBalance from '~/hooks/useAtomBalance'
import { useDialogWithValue } from '~/hooks/useDialog'
import useGetSendAuthorizationAmount, {
  useInvalidateSendAuthorizationAmount,
} from '~/hooks/useGetSendAuthorizationAmount'
import { useLaunchpadOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import TxDialog from './dialogs/TxDialog'
import { Wallet } from './wallet/Wallet'

export default function MintInscription({
  launchpad,
  className,
  activeStage,
  metadataProvider,
  disabled = false,
}: {
  launchpad: LaunchpadDetail
  className?: string
  activeStage: StageDetail | undefined
  metadataProvider?: () => Promise<unknown>
  disabled?: boolean
}) {
  const isLedger = useIsLedger()
  const { minterAddress, launchpadEnabled } = useRootContext()
  const operations = useLaunchpadOperations()
  const [inProgress, setInProgress] = useState(false)
  const atomBalance = useAtomBalance()

  const { data: authorizedAmount } = useGetSendAuthorizationAmount(
    operations?.address ?? '',
    minterAddress,
  )
  const invalidateAuthorizedAmount = useInvalidateSendAuthorizationAmount(
    operations?.address ?? '',
    minterAddress,
  )

  const {
    dialogRef,
    value: inscription,
    showDialog,
  } = useDialogWithValue<TxInscription | null>()

  const isEligible =
    activeStage == null ||
    !activeStage.has_whitelist ||
    activeStage.whitelists[0] != null

  const userReservations =
    activeStage?.reservations_aggregate.aggregate?.count ?? 0
  const reachedLimit =
    activeStage?.per_user_limit &&
    userReservations >= activeStage.per_user_limit
  const isMintedOut =
    launchpad.max_supply && launchpad.max_supply === launchpad.minted_supply

  const [amount, setAmount] = useState(1)
  let max = Infinity

  if (launchpad.max_supply) {
    max = launchpad.max_supply - launchpad.minted_supply
  }
  if (activeStage && activeStage.per_user_limit) {
    max = Math.min(max, activeStage.per_user_limit - userReservations)
  }

  const mintFee = 100000
  const fee = mintFee + (activeStage?.price ?? 0)
  const requiredAmount = fee * amount + (authorizedAmount ?? 0)

  async function mint() {
    if (!activeStage) {
      console.warn('No active stage')
      return
    }

    if (!operations) {
      console.warn('No address')
      showDialog(null)
      return
    }

    setInProgress(true)

    let metadata: undefined | unknown
    if (typeof metadataProvider === 'function') {
      metadata = await metadataProvider()
    }

    const txInscription = operations.reserve(
      launchpad.transaction.hash,
      activeStage.id,
      amount,
      metadata,
    )

    const grant = getGrantSendMsg(operations.address, minterAddress, {
      allowList: [],
      spendLimit: [{ denom: 'uatom', amount: `${requiredAmount}` }],
    })
    txInscription.messages = [grant]

    showDialog(txInscription)

    setInProgress(false)
  }

  return (
    <div className={className}>
      {!launchpadEnabled ? (
        <Button
          disabled
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          Launchpad disabled
        </Button>
      ) : !operations ? (
        <Wallet className="btn-md w-full" color="primary" />
      ) : isMintedOut ? (
        <Link
          className="btn btn-success w-full"
          to={`/app/collection/${launchpad.collection.symbol}`}
        >
          <CheckIcon className="size-4" />
          Minted out, see collection
        </Link>
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
      ) : atomBalance < requiredAmount ? (
        <Button
          disabled
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          You do not have enough funds to complete this transaction
        </Button>
      ) : isLedger ? (
        <Button
          disabled
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          Minting is not supported when using Ledger
        </Button>
      ) : (
        <div className="flex w-full">
          <Input
            type="number"
            className="w-16 h-12 text-lg pr-0"
            size="sm"
            min={1}
            max={max}
            step={1}
            disabled={disabled}
            color={amount > max || amount < 1 ? 'error' : undefined}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          />
          <Button
            onClick={() => mint()}
            color="primary"
            fullWidth
            disabled={disabled}
            loading={inProgress}
            className="shrink ml-2"
            startIcon={<CubeIcon className="size-4" />}
          >
            Mint now
          </Button>
        </div>
      )}
      <TxDialog
        ref={dialogRef}
        txInscription={inscription}
        description={
          <Alert className="mt-2 border border-warning">
            Please note that this image won&apos;t be inscribed until the
            &ldquo;reveal&rdquo; date. That means you&apos;ll need to review and
            pre-approve spending the mint price in your wallet popup to proceed.
          </Alert>
        }
        resultCTA="Back to mint"
        resultLink={`/app/launchpad/${launchpad.collection.symbol}`}
        onSuccess={() => {
          invalidateAuthorizedAmount()
        }}
      />
    </div>
  )
}
