import { ClockIcon } from '@heroicons/react/24/outline'
import { Link, useSearchParams } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { Token, TokenTradeHistory } from '~/api/token'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { shortAddress } from '~/utils/string'

export default function LatestTransactions({
  token,
  transactions,
}: {
  token: Token
  transactions: TokenTradeHistory[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const txs = searchParams.get('txs')
  const tokenOnlyTxs = txs === 'token'

  return (
    <div className="flex-col shrink-0 items-center w-96 border-l border-l-neutral hidden xl:flex text-center">
      <div className="fixed py-8 flex flex-col w-available">
        <div className="text-lg">Latest transactions</div>
        <div className="flex justify-center items-center text-sm">
          <button
            className={tokenOnlyTxs ? 'text-header-content' : 'text-primary'}
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
            className={tokenOnlyTxs ? 'text-primary' : 'text-header-content'}
            onClick={() =>
              setSearchParams((prev) => {
                prev.set('txs', 'token')
                return prev
              })
            }
          >
            {token.ticker} only
          </button>
        </div>
        <div className="flex flex-row justify-between mt-4 uppercase text-header-content px-4">
          <span className="p-2 w-1/12">
            <ClockIcon className="size-5" />
          </span>
          <span className="p-2 w-3/12">Amount</span>
          <span className="p-2 w-2/12">Price</span>
          <span className="p-2 w-2/12">Seller</span>
          <span className="p-2 w-2/12">Buyer</span>
        </div>
        <Divider className="my-1" />
        <div className="overflow-y-scroll no-scrollbar h-[calc(100vh-250px)]">
          {transactions.length < 1 && (
            <span>No transactions for {token.ticker}</span>
          )}
          {transactions.map((tx) => (
            <span
              key={tx.id}
              className="flex flex-row justify-between items-center w-full rounded-none px-4 py-3 border-b border-b-neutral text-sm"
            >
              <span className="mx-1 shrink-0 w-1/12">
                {getDateAgo(tx.date_created, true)}
              </span>
              <Link
                to={`/app/market/${tx.token.ticker}`}
                className="shrink-0 w-3/12 flex flex-col font-mono items-center hover:text-primary"
              >
                <NumericFormat
                  displayType="text"
                  thousandSeparator
                  value={getDecimalValue(tx.amount_base, 6)}
                />
                <span className="mt-1">{tx.token.ticker}</span>
              </Link>
              <span className="shrink-0 w-2/12 flex flex-col font-mono items-center">
                <NumericFormat
                  displayType="text"
                  thousandSeparator
                  value={getDecimalValue(tx.amount_quote, 6)}
                />
                <span className="mt-1">ATOM</span>
              </span>
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
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
