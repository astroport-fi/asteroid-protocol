import { ClockIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from '@remix-run/react'
import { Button, Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { InscriptionTradeHistory } from '~/api/inscription'
import InscriptionImage from '~/components/InscriptionImage'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { shortAddress } from '~/utils/string'

export default function LatestInscriptionTxs({
  transactions,
}: {
  transactions: InscriptionTradeHistory[]
}) {
  const navigate = useNavigate()

  return (
    <div className="flex-col shrink-0 items-center w-96 border-l border-l-neutral hidden lg:flex text-center">
      <div className="fixed py-8 flex flex-col w-available">
        <div>Latest transactions</div>
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
        <div className="overflow-y-scroll no-scrollbar h-[calc(100vh-250px)]">
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
