import { getGrantSendMsg } from '@asteroid-protocol/sdk/msg'
import { CheckIcon } from '@heroicons/react/20/solid'
import { Link, useNavigate } from '@remix-run/react'
import { useMemo } from 'react'
import { Button } from 'react-daisyui'
import { toast } from 'react-toastify'
import { TrollPost } from '~/api/trollbox'
import { useRootContext } from '~/context/root'
import useAtomBalance from '~/hooks/useAtomBalance'
import useGetSendAuthorizationAmount, {
  useInvalidateSendAuthorizationAmount,
} from '~/hooks/useGetSendAuthorizationAmount'
import { useTrollBoxOperations } from '~/hooks/useOperations'
import useToastSubmitTx from '~/hooks/useToastSubmitTx'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import PlusIcon from '../icons/Plus'

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
  const atomBalance = useAtomBalance()

  const { data: authorizedAmount } = useGetSendAuthorizationAmount(
    operations?.address ?? '',
    minterAddress,
  )
  const invalidateAuthorizedAmount = useInvalidateSendAuthorizationAmount(
    operations?.address ?? '',
    minterAddress,
  )

  const symbol = `TROLL:${trollPost.id}`
  const maxSupply = 100
  const mintedSupply =
    trollPost.launchpad?.mint_reservations_aggregate?.aggregate?.max
      ?.token_id ?? 0
  // const max = maxSupply - mintedSupply
  const isMintedOut = mintedSupply === maxSupply

  // @todo we can't simply multiply the price by the amount, because the price is dynamic
  // const [amount, setAmount] = useState(1)

  const mintFee = 100000
  const fee = mintFee + price
  const requiredAmount = fee + (authorizedAmount ?? 0)

  const txInscription = useMemo(() => {
    if (!operations) {
      return null
    }

    const txInscription = operations.collect(trollPost.transaction.hash)

    const grant = getGrantSendMsg(operations.address, minterAddress, {
      allowList: [],
      spendLimit: [{ denom: 'uatom', amount: `${requiredAmount}` }],
    })
    txInscription.messages = [grant]
    return txInscription
  }, [operations, trollPost.transaction.hash, requiredAmount, minterAddress])

  const navigate = useNavigate()
  const { sendTx } = useToastSubmitTx(txInscription, {
    onSuccess: () => {
      navigate({ hash: '' }, { replace: true })
    },
    successMessage: 'Post collected',
  })

  async function mint() {
    if (!operations) {
      toast.error('Wallet is not connected')
      return
    }

    if (atomBalance < requiredAmount) {
      toast.error('You do not have enough funds to complete this transaction')
      return
    }

    if (isLedger) {
      toast.error('Collecting is not supported when using Ledger')
      return
    }

    sendTx()
  }

  // @todo change You do not have enough funds to complete this transaction not a notification

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
            className="shrink"
            startIcon={<PlusIcon className="size-4" />}
          >
            Collect
          </Button>
        </div>
      )}
      {/* <TxDialog
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
        resultLink={`/portfolio`}
        onSuccess={() => {
          invalidateAuthorizedAmount()
        }}
      /> */}
    </div>
  )
}
