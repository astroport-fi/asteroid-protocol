import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { ClockIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import {
  Button,
  Form as DaisyForm,
  Divider,
  Input,
  Loading,
  Radio,
} from 'react-daisyui'
import InfiniteScroll from 'react-infinite-scroll-component'
import { NumericFormat } from 'react-number-format'
import { twMerge } from 'tailwind-merge'
import { AsteroidClient } from '~/api/client'
import {
  InscriptionTradeHistory,
  InscriptionWithMarket,
} from '~/api/inscription'
import InscriptionImage from '~/components/InscriptionImage'
import { Inscriptions } from '~/components/Inscriptions'
import BuyInscriptionDialog from '~/components/dialogs/BuyInscriptionDialog'
import Select, { DropdownItem } from '~/components/form/Select'
import useDialog from '~/hooks/useDialog'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { parsePagination } from '~/utils/pagination'
import { shortAddress } from '~/utils/string'

enum Sort {
  LOWEST_PRICE = 'lowest_price',
  HIGHEST_PRICE = 'highest_price',
  RECENTLY_LISTED = 'recently_listed',
  LOWEST_ID = 'lowest_id',
  HIGHEST_ID = 'highest_id',
}

enum Range {
  ALL = 'all',
  SUB_100 = '100',
  SUB_1_000 = '1000',
  SUB_10_000 = '10000',
  SUB_50_000 = '50000',
}

enum PriceRange {
  ALL = 'all',
  BELOW_0_1 = '0-0.1',
  BETWEEN_0_1_AND_1 = '0.1-1',
  BETWEEN_1_AND_5 = '1-5',
  BETWEEN_5_AND_10 = '5-10',
  BETWEEN_10_AND_100 = '10-100',
  ABOVE_100 = '100-10000',
}

type Status = 'all' | 'buy'
const DEFAULT_STATUS: Status = 'buy'
const DEFAULT_SORT = Sort.RECENTLY_LISTED
const DEFAULT_RANGE = Range.ALL
const DEFAULT_PRICE_RANGE = PriceRange.ALL

const LIMIT = 30

export async function loader({ context, request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const status = searchParams.get('status') ?? DEFAULT_STATUS
  const range = searchParams.get('range') ?? DEFAULT_RANGE
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const sort = searchParams.get('sort') ?? DEFAULT_SORT
  const search = searchParams.get('search') ?? ''

  let orderBy: ValueTypes['inscription_market_order_by'] | undefined
  switch (sort) {
    case Sort.LOWEST_PRICE:
      orderBy = {
        inscription: {
          id: order_by.desc,
        },
        marketplace_listing: {
          total: order_by.asc,
        },
      }
      break
    case Sort.HIGHEST_PRICE:
      orderBy = {
        inscription: {
          id: order_by.desc,
        },
        marketplace_listing: {
          total: order_by.desc_nulls_last,
        },
      }
      break
    case Sort.RECENTLY_LISTED:
      orderBy = {
        marketplace_inscription_detail: {
          id: order_by.desc_nulls_last,
        },
        inscription: {
          id: order_by.desc,
        },
      }
      break
    case Sort.LOWEST_ID:
      orderBy = {
        marketplace_inscription_detail: {
          inscription_id: order_by.asc_nulls_last,
        },
        inscription: {
          id: order_by.asc,
        },
      }
      break
    case Sort.HIGHEST_ID:
      orderBy = {
        marketplace_inscription_detail: {
          inscription_id: order_by.desc_nulls_last,
        },
        inscription: {
          id: order_by.desc,
        },
      }
      break
  }

  const { offset, limit, page } = parsePagination(searchParams, LIMIT)
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const result = await asteroidClient.getInscriptions(
    offset,
    limit,
    {
      onlyBuy: status == 'buy',
      idLTE: range != Range.ALL ? parseInt(range) : undefined,
      priceGTE: from ? parseFloat(from) * 10e5 : undefined,
      priceLTE: to ? parseFloat(to) * 10e5 : undefined,
      search,
    },
    orderBy,
  )

  if (page > 1) {
    return json({
      inscriptions: result.inscriptions,
      count: result.count,
      page,
      transactions: [],
    })
  }

  const transactions = await asteroidClient.getInscriptionTradeHistory()

  return json({
    inscriptions: result.inscriptions,
    count: result.count,
    page,
    transactions,
  })
}

function StatusFilter({
  selected,
  onChange,
}: {
  selected: Status
  onChange: (status: Status) => void
}) {
  return (
    <div className="flex flex-col">
      <DaisyForm.Label
        title="Only buy now"
        className="flex flex-row-reverse items-center justify-end px-0"
      >
        <Radio
          value="buy"
          className="mr-2"
          name="status"
          checked={selected == 'buy'}
          onChange={() => onChange('buy')}
        />
      </DaisyForm.Label>

      <DaisyForm.Label
        title="Show all"
        className="flex flex-row-reverse items-center justify-end px-0"
      >
        <Radio
          value="all"
          className="mr-2"
          name="status"
          checked={selected == 'all'}
          onChange={() => onChange('all')}
        />
      </DaisyForm.Label>
    </div>
  )
}

function FilterTitle({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={twMerge('text-header-content text-sm uppercase', className)}
    >
      {children}
    </span>
  )
}

function Filter({ onChange }: { onChange: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const sortItems: DropdownItem<Sort>[] = [
    { label: 'Recently listed', value: Sort.RECENTLY_LISTED },
    { label: 'Lowest ID', value: Sort.LOWEST_ID },
    { label: 'Lowest price', value: Sort.LOWEST_PRICE },
    { label: 'Highest price', value: Sort.HIGHEST_PRICE },
    { label: 'Highest ID', value: Sort.HIGHEST_ID },
  ]

  const priceRangeItems: DropdownItem<PriceRange>[] = [
    { label: 'All', value: PriceRange.ALL },
    { label: '< 0.1 ATOM', value: PriceRange.BELOW_0_1 },
    { label: '0.1 - 1 ATOM', value: PriceRange.BETWEEN_0_1_AND_1 },
    { label: '1 - 5 ATOM', value: PriceRange.BETWEEN_1_AND_5 },
    { label: '5 - 10 ATOM', value: PriceRange.BETWEEN_5_AND_10 },
    { label: '10 - 100 ATOM', value: PriceRange.BETWEEN_10_AND_100 },
    { label: '100 ATOM+', value: PriceRange.ABOVE_100 },
  ]

  const rangeItems: DropdownItem<Range>[] = [
    { label: 'All', value: Range.ALL },
    { label: 'Sub 100', value: Range.SUB_100 },
    { label: 'Sub 1 000', value: Range.SUB_1_000 },
    { label: 'Sub 10 000', value: Range.SUB_10_000 },
    { label: 'Sub 50 000', value: Range.SUB_50_000 },
  ]

  const [sort, setSort] = useState<Sort>(
    (searchParams.get('sort') as Sort) ?? DEFAULT_SORT,
  )

  const priceFrom = searchParams.get('from')
  let defaultPriceRange = DEFAULT_PRICE_RANGE
  if (priceFrom) {
    defaultPriceRange = `${priceFrom}-${searchParams.get('to')}` as PriceRange
  }
  const [priceRange, setPriceRange] = useState<PriceRange>(defaultPriceRange)
  const [range, setRange] = useState<Range>(
    (searchParams.get('range') as Range) ?? DEFAULT_RANGE,
  )
  const [status, setStatus] = useState<Status>(
    (searchParams.get('status') as Status) ?? DEFAULT_STATUS,
  )
  const defaultSearch = searchParams.get('search') ?? ''

  useEffect(() => {
    const currentStatus = searchParams.get('status') ?? DEFAULT_STATUS
    if (currentStatus !== status) {
      onChange()
      setSearchParams((prev) => {
        prev.set('status', status)
        return prev
      })
    }
  }, [searchParams, status, setSearchParams, onChange])

  useEffect(() => {
    const currentSort = searchParams.get('sort') ?? DEFAULT_SORT
    if (currentSort !== sort) {
      onChange()
      setSearchParams((prev) => {
        prev.set('sort', sort)
        return prev
      })
    }
  }, [searchParams, sort, setSearchParams, onChange])

  useEffect(() => {
    const currentRange = searchParams.get('range') ?? DEFAULT_RANGE
    if (currentRange !== range) {
      onChange()
      setSearchParams((prev) => {
        prev.set('range', range)
        return prev
      })
    }
  }, [searchParams, range, setSearchParams, onChange])

  useEffect(() => {
    const from = searchParams.get('from') ?? DEFAULT_PRICE_RANGE
    const range = priceRange.split('-')
    if (from !== range[0]) {
      onChange()
      setSearchParams((prev) => {
        if (range[0] == PriceRange.ALL) {
          prev.delete('from')
          prev.delete('to')
        } else {
          prev.set('from', range[0])
          prev.set('to', range[1])
        }

        return prev
      })
    }
  }, [searchParams, priceRange, setSearchParams, onChange])

  return (
    <div className="flex flex-col shrink-0 items-center w-52 border-r border-r-neutral">
      <div className="flex flex-col items-start absolute py-8">
        <div className="flex flex-col items-start w-full px-6">
          <FilterTitle>Status</FilterTitle>
          <StatusFilter selected={status} onChange={setStatus} />
          <FilterTitle className="mt-6">Sort</FilterTitle>
          <Select items={sortItems} onSelect={setSort} selected={sort} />
          <FilterTitle className="mt-6">Price</FilterTitle>
          <Select
            items={priceRangeItems}
            onSelect={setPriceRange}
            selected={priceRange}
          />
          <FilterTitle className="mt-6">Inscription range</FilterTitle>
          <Select items={rangeItems} onSelect={setRange} selected={range} />
          <FilterTitle className="mt-6">Search</FilterTitle>
          <Form method="get" onSubmit={() => onChange()}>
            <Input
              className="w-full mt-2"
              placeholder="Name"
              name="search"
              size="sm"
              defaultValue={defaultSearch}
            />
          </Form>
          <Link
            to="/app/wallet/inscriptions"
            className="btn btn-primary mt-8"
            color="accent"
          >
            List inscription
          </Link>
        </div>
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
              className="flex flex-row justify-between w-full rounded-none px-4"
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
                  className="rounded-xl size-8"
                />
              </span>
              <NumericFormat
                className="shrink-0 w-3/12"
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

export default function InscriptionsPage() {
  const [searchParams] = useSearchParams()
  const { dialogRef, handleShow } = useDialog()
  const [inscription, setInscription] = useState<InscriptionWithMarket | null>(
    null,
  )
  const data = useLoaderData<typeof loader>()
  const fetcher = useFetcher<typeof loader>()
  const ref = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [items, setItems] = useState<InscriptionWithMarket[]>([])
  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return
    }

    if (fetcher.data) {
      const newItems = fetcher.data.inscriptions
      setItems((prevItems) => [...prevItems, ...newItems])
    }
  }, [fetcher.data, fetcher.state])

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = 0
    }
    setItems(data.inscriptions)
    setIsLoading(false)
  }, [data.inscriptions, setItems])

  function getMoreData() {
    const page = items.length == LIMIT ? data.page + 1 : fetcher.data!.page + 1
    const queryParams = new URLSearchParams(searchParams)
    queryParams.set('page', `${page}`)
    const query = `?${queryParams.toString()}`
    fetcher.load(query)
  }

  return (
    <div className="flex flex-row h-full">
      <Filter onChange={() => setIsLoading(true)} />
      <div className="flex flex-col w-full">
        <BuyInscriptionDialog inscription={inscription!} ref={dialogRef} />
        {data.inscriptions.length > 0 ? (
          <div
            id="scrollableDiv"
            ref={ref}
            className="overflow-y-scroll h-full"
          >
            <InfiniteScroll
              dataLength={items.length}
              next={getMoreData}
              hasMore={data.count > items.length}
              loader={
                <div className="flex justify-center mb-12">
                  <Loading variant="dots" size="lg" />
                </div>
              }
              scrollableTarget="scrollableDiv"
            >
              {!isLoading && (
                <Inscriptions
                  className="p-8"
                  inscriptions={items}
                  onClick={(inscription) => {
                    setInscription(inscription)
                    handleShow()
                  }}
                />
              )}
            </InfiniteScroll>
          </div>
        ) : (
          <span className="mt-8 ml-8">
            No inscriptions for selected filters
          </span>
        )}
      </div>
      <LatestTransactions transactions={data.transactions!} />
    </div>
  )
}
