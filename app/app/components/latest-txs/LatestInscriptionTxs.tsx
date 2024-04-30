import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate, useSearchParams } from '@remix-run/react'
import { Button, Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { InscriptionTradeHistory } from '~/api/inscription'
import InscriptionImage from '~/components/InscriptionImage'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { shortAddress } from '~/utils/string'

export default function LatestInscriptionTxs({
  transactions,
  collectionName,
}: {
  transactions: InscriptionTradeHistory[]
  collectionName?: string
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const txs = searchParams.get('txs')
  const collectionOnlyTxs = txs === 'collection'

  return (
    <div className="flex flex-col shrink-0 items-center h-full w-96 border-l border-l-neutral text-center bg-base-100 lg:bg-transparent">
      <div className="fixed pt-4 lg:pt-8  flex flex-col w-available">
        <label
          htmlFor="transactions-drawer"
          aria-label="close sidebar"
          className="flex lg:hidden justify-end px-4"
        >
          <XMarkIcon className="size-5" />
        </label>
        <div className="text-lg">Latest transactions</div>
        {collectionName && (
          <div className="flex justify-center items-center text-sm">
            <button
              className={
                collectionOnlyTxs ? 'text-header-content' : 'text-primary'
              }
              onClick={() =>
                setSearchParams((prev) => {
                  prev.delete('txs')
                  return prev
                })
              }
            >
              All
            </button>{' '}
            <span className="mx-1">|</span>
            <button
              className={
                collectionOnlyTxs ? 'text-primary' : 'text-header-content'
              }
              onClick={() =>
                setSearchParams((prev) => {
                  prev.set('txs', 'collection')
                  return prev
                })
              }
            >
              {collectionName} only
            </button>
          </div>
        )}
        <div className="flex flex-row justify-between mt-4 uppercase text-header-content px-4">
          <span className="p-2 w-1/12">
            <ClockIcon className="size-5" />
          </span>
          <span className="p-2 w-2/12">Item</span>
          <span className="p-2 w-3/12">Price</span>
          <span className="p-2 w-2/12">Seller</span>
          <span className="p-2 w-2/12">Buyer</span>
        </div>
        <Divider className="my-1" />
        <div className="overflow-y-scroll no-scrollbar h-[calc(100vh-195px)] lg:h-[calc(100vh-264px)]">
          {transactions.length < 1 && (
            <span>No transactions for {collectionName}</span>
          )}
          {transactions.map((tx) => (
            <Button
              onClick={() => {
                navigate(`/app/inscription/${tx.inscription.transaction.hash}`)
              }}
              key={tx.id}
              color="ghost"
              className="flex flex-row font-normal justify-between w-full rounded-none px-4"
            >
              <span className="mx-1 shrink-0 w-1/12">
                {getDateAgo(tx.date_created, true)}
              </span>
              <span className="shrink-0 w-2/12 flex justify-center">
                <InscriptionImage
                  min
                  mime={tx.inscription.mime}
                  src={tx.inscription.content_path}
                  isExplicit={tx.inscription.is_explicit}
                  imageClassName="rounded-xl"
                  className="size-8"
                />
              </span>
              <NumericFormat
                className="font-mono shrink-0 w-3/12"
                displayType="text"
                thousandSeparator
                suffix=" ATOM"
                value={getDecimalValue(tx.amount_quote, 6)}
              />
              <Link
                to={`/app/wallet/${tx.seller_address}`}
                className="shrink-0 w-2/12 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {shortAddress(tx.seller_address)}
              </Link>
              <Link
                to={`/app/wallet/${tx.buyer_address}`}
                className="shrink-0 w-2/12 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {shortAddress(tx.buyer_address!)}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
