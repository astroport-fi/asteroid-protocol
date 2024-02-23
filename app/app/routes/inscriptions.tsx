import { ClockIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { useState } from 'react'
import { Button, Divider, Dropdown } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import InscriptionImage from '~/components/InscriptionImage'
import { Inscriptions } from '~/components/Inscriptions'
import BuyInscriptionDialog from '~/components/dialogs/BuyInscriptionDialog'
import Select, { DropdownItem } from '~/components/form/Select'
import useDialog from '~/hooks/useDialog'
import {
  AsteroidService,
  InscriptionTradeHistory,
  InscriptionWithMarket,
} from '~/services/asteroid'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { parsePagination } from '~/utils/pagination'
import { shortAddress } from '~/utils/string'

export async function loader({ context, request }: LoaderFunctionArgs) {
  // @todo offset, limit
  const { offset, limit } = parsePagination(new URL(request.url).searchParams)
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const inscriptions = await asteroidService.getInscriptions(0, 500)
  const transactions = await asteroidService.getInscriptionTradeHistory()

  return json({
    inscriptions,
    transactions,
  })
}

function Filter() {
  const sortItems: DropdownItem[] = [
    { label: 'Lowest price', value: 'lowest_price' },
    { label: 'Highest price', value: 'highest_price' },
    { label: 'Recently listed', value: 'recently_listed' },
    { label: 'Lowest ID', value: 'lowest_id' },
    { label: 'Highest ID', value: 'highest_id' },
  ]

  const priceItems: DropdownItem[] = [
    { label: '< 0.1 ATOM', value: '0-100000' },
    { label: '0.1 - 1 ATOM', value: '100000-1000000' },
    { label: '1 - 5 ATOM', value: '1000000-5000000' },
    { label: '5 - 10 ATOM', value: '5000000-10000000' },
    { label: '10 - 100 ATOM', value: '10000000-100000000' },
    { label: '100 ATOM+', value: '100000000-10000000000' },
  ]

  const rangeItems: DropdownItem[] = [
    { value: 'all', label: 'All' },
    { value: '100', label: 'Sub 100' },
    { value: '1000', label: 'Sub 1 000' },
    { value: '10000', label: 'Sub 10 000' },
    { value: '50000', label: 'Sub 50 000' },
  ]

  const [sort, setSort] = useState<DropdownItem>(sortItems[0])
  const [price, setPrice] = useState<DropdownItem>(priceItems[0])
  const [range, setRange] = useState<DropdownItem>(rangeItems[0])

  return (
    <div className="flex flex-col shrink-0 items-center w-52 border-r border-r-neutral">
      <div className="flex flex-col items-center absolute py-8">
        <span className="text-gray-500 text-sm uppercase">Sort</span>
        <Select items={sortItems} onSelect={setSort} selected={sort} />
        <span className="text-gray-500 text-sm uppercase mt-6">Price</span>
        <Select items={priceItems} onSelect={setPrice} selected={price} />
        <span className="text-gray-500 text-sm uppercase mt-6">
          Inscription range
        </span>
        <Select items={rangeItems} onSelect={setRange} selected={range} />

        <Link
          to="/wallet/inscriptions"
          className="btn btn-primary mt-8"
          color="accent"
        >
          List inscription
        </Link>
      </div>
    </div>
  )
}

function LatestTransactions({
  transactions,
}: {
  transactions: InscriptionTradeHistory[]
}) {
  const navigate = useNavigate()

  return (
    <div className="flex-col shrink-0 items-center w-96 border-l border-l-neutral hidden lg:flex">
      <div className="fixed py-8 flex flex-col pl-2 w-[-webkit-fill-available]">
        <div className="text-center">Latest transactions</div>
        <div className="flex flex-row justify-between mt-4 uppercase text-gray-500 px-4">
          <span className="p-2 shrink-0">
            <ClockIcon className="size-5" />
          </span>
          <span className="p-2 shrink-0">Item</span>
          <span className="p-2 shrink-0">Price</span>
          <span className="p-2 shrink-0">Seller</span>
          <span className="p-2 shrink-0">Buyer</span>
        </div>
        <Divider className="my-1" />
        <div className="overflow-y-scroll no-scrollbar h-[calc(100vh-250px)]">
          {transactions.map((tx) => (
            <Button
              onClick={() => {
                navigate(`/inscription/${tx.inscription.transaction.hash}`)
              }}
              key={tx.id}
              color="ghost"
              className="flex flex-row justify-between w-full rounded-none"
            >
              <span className="p-2 shrink-0">
                {getDateAgo(tx.date_created, true)}
              </span>
              <span className="p-2 shrink-0">
                <InscriptionImage
                  min
                  mime={tx.inscription.mime}
                  src={tx.inscription.content_path}
                  isExplicit={tx.inscription.is_explicit}
                  className="rounded-xl size-8"
                />
              </span>
              <NumericFormat
                className="p-2 shrink-0"
                displayType="text"
                thousandSeparator
                suffix=" ATOM"
                value={getDecimalValue(tx.amount_quote, 6)}
              />
              <Link
                to={`/wallet/${tx.seller_address}`}
                className="p-2 shrink-0 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {shortAddress(tx.seller_address)}
              </Link>
              <Link
                to={`/wallet/${tx.buyer_address}`}
                className="p-2 shrink-0 hover:text-primary"
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

export default function InscriptionsPage() {
  const { dialogRef, handleShow } = useDialog()
  const [inscription, setInscription] = useState<InscriptionWithMarket | null>(
    null,
  )

  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-row">
      <Filter />
      <div>
        <BuyInscriptionDialog inscription={inscription!} ref={dialogRef} />
        <Inscriptions
          className="p-8 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4"
          inscriptions={data.inscriptions}
          onClick={(inscription) => {
            setInscription(inscription)
            handleShow()
          }}
        />
      </div>
      <LatestTransactions transactions={data.transactions} />
    </div>
  )
}
