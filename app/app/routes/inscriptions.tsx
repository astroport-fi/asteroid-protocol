import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ClockIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { Button, Divider, Dropdown } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import InscriptionImage from '~/components/InscriptionImage'
import { Inscriptions } from '~/components/Inscriptions'
import BuyInscriptionDialog from '~/components/dialogs/BuyInscriptionDialog'
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

interface DropdownItem {
  label: string
  value: string
}

function DropdownSelect({
  items,
  selected,
  onSelect,
}: {
  items: DropdownItem[]
  selected: DropdownItem
  onSelect: (item: DropdownItem) => void
}) {
  return (
    <Dropdown>
      <Dropdown.Toggle button={false} className="flex flex-row">
        {selected.label} <ChevronDownIcon className="size-5" />
      </Dropdown.Toggle>
      <Dropdown.Menu className="w-52">
        {items.map((item) => (
          <Dropdown.Item onClick={() => onSelect(item)} key={item.value}>
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

function Filter() {
  const sortItems: DropdownItem[] = [
    { label: 'Lowest price', value: 'lowest_price' },
    { label: 'Highest price', value: 'highest_price' },
    { label: 'Recently listed', value: 'recently_listed' },
    { label: 'Lowest ID', value: 'lowest_id' },
    { label: 'Highest ID', value: 'highest_id' },
  ]

  return (
    <div className="flex flex-col shrink-0 items-center w-52 border-r border-r-neutral">
      <div className="flex flex-col items-center absolute py-8">
        <span className="text-gray-500 text-sm uppercase">Sort</span>
        <DropdownSelect
          items={sortItems}
          onSelect={(item) => console.log(item)}
          selected={sortItems[0]}
        />
        <span className="text-gray-500 text-sm uppercase mt-6">Price</span>
        <DropdownSelect
          items={sortItems}
          onSelect={(item) => console.log(item)}
          selected={sortItems[0]}
        />
        <span className="text-gray-500 text-sm uppercase mt-6">
          Inscription range
        </span>
        <DropdownSelect
          items={sortItems}
          onSelect={(item) => console.log(item)}
          selected={sortItems[0]}
        />

        <Button className="mt-8" color="accent">
          List inscription
        </Button>
      </div>
    </div>
  )
}

function LatestTransactions({
  transactions,
}: {
  transactions: InscriptionTradeHistory[]
}) {
  return (
    <div className="flex-col shrink-0 items-center w-96 border-l border-l-neutral hidden lg:flex">
      <div className="fixed py-8 flex flex-col px-4 w-[-webkit-fill-available]">
        <div className="text-center">Latest transactions</div>
        <div className="flex flex-row justify-between mt-4 uppercase text-gray-500">
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
            <div key={tx.id} className="flex flex-row justify-between w-full">
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
              <span className="p-2 shrink-0">
                {shortAddress(tx.seller_address)}
              </span>
              <span className="p-2 shrink-0">
                {shortAddress(tx.buyer_address!)}
              </span>
            </div>
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
