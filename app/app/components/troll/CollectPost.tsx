import { TxInscription } from '@asteroid-protocol/sdk'
import { getGrantSendMsg } from '@asteroid-protocol/sdk/msg'
import { CheckIcon, CubeIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { Link } from '@remix-run/react'
import { useState } from 'react'
import { Alert, Button } from 'react-daisyui'
import { TrollPost } from '~/api/trollbox'
import { useRootContext } from '~/context/root'
import useAtomBalance from '~/hooks/useAtomBalance'
import { useDialogWithValue } from '~/hooks/useDialog'
import useGetSendAuthorizationAmount, {
  useInvalidateSendAuthorizationAmount,
} from '~/hooks/useGetSendAuthorizationAmount'
import { useTrollBoxOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import TxDialog from '../dialogs/TxDialog'

export default function CollectPost({
  trollPost,
  price,
  className,
}: {
  trollPost: TrollPost
  price: number
  className?: string
}) {
  const isLedger = useIsLedger()
  const { minterAddress } = useRootContext()
  const operations = useTrollBoxOperations()
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

  const symbol = `TROLL:${trollPost.id}`
  const maxSupply = 100
  const mintedSupply =
    trollPost.launchpad?.mint_reservations_aggregate?.aggregate?.max
      ?.token_id ?? 0
  // const max = maxSupply - mintedSupply
  const isMintedOut = mintedSupply === maxSupply

  // @todo we can't simply multiply the price by the amount, because the price is dynamic
  // const [amount, setAmount] = useState(1)

  const [notEnoughFunds, setNotEnoughFunds] = useState(false)

  const mintFee = 100000
  const fee = mintFee + price
  const requiredAmount = fee + (authorizedAmount ?? 0)

  async function mint() {
    if (!operations) {
      console.warn('No address')
      showDialog(null)
      return
    }

    if (atomBalance < requiredAmount) {
      setNotEnoughFunds(true)
      return
    }

    setInProgress(true)

    const txInscription = operations.collect(trollPost.transaction.hash)

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
      {isMintedOut ? (
        <Link
          className="btn btn-success w-full btn-sm"
          to={`/app/collection/${symbol}`}
        >
          <CheckIcon className="size-4" />
          Minted out, see collection
        </Link>
      ) : notEnoughFunds ? (
        <Button
          color="error"
          size="sm"
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          You do not have enough funds to complete this transaction
        </Button>
      ) : isLedger ? (
        <Button
          disabled
          size="sm"
          fullWidth
          startIcon={<NoSymbolIcon className="size-4" />}
        >
          Minting is not supported when using Ledger
        </Button>
      ) : (
        <div className="flex w-full">
          {/* <Input
            type="number"
            className="w-16 h-12 text-lg pr-0"
            size="sm"
            min={1}
            max={max}
            step={1}
            color={amount > max || amount < 1 ? 'error' : undefined}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          /> */}
          <Button
            onClick={() => mint()}
            size="sm"
            fullWidth
            loading={inProgress}
            className="shrink"
            startIcon={<CubeIcon className="size-4" />}
          >
            Collect
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
        resultCTA="See the collected post"
        resultLink={`/app/trollbox/portfolio`}
        onSuccess={() => {
          invalidateAuthorizedAmount()
        }}
      />
    </div>
  )
}
