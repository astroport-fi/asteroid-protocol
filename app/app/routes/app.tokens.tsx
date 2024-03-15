import { order_by } from '@asteroid-protocol/sdk/client'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import {
  Form,
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Form as DaisyForm } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { AsteroidClient } from '~/api/client'
import { TokenMarket, isTokenLaunched } from '~/api/token'
import AtomValue from '~/components/AtomValue'
import PercentageText from '~/components/PercentageText'
import Stat from '~/components/Stat'
import { TokenCell } from '~/components/TokenCell'
import Table from '~/components/table'
import { useRootContext } from '~/context/root'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams)
  const { sort, direction } = parseSorting(url.searchParams, 'id', order_by.asc)
  const search = url.searchParams.get('search')

  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getTokenMarkets(
    offset,
    limit,
    { userAddress: address, search },
    {
      [sort]: direction,
    },
  )

  return json({
    tokens: res.tokens,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

const DEFAULT_SORT = { id: 'id', desc: false }

export default function MarketsPage() {
  const data = useLoaderData<typeof loader>()
  const columnHelper = createColumnHelper<TokenMarket>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultSearch = searchParams.get('search') ?? ''

  const {
    status: { baseTokenUsd },
  } = useRootContext()

  const columns = [
    columnHelper.accessor('id', {
      header: '#',
      size: 40,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('name', {
      header: 'Name',

      cell: (info) => <TokenCell token={info.row.original} />,
    }),
    columnHelper.accessor((row) => row.circulating_supply / row.max_supply, {
      enableSorting: false,
      header: 'Minted',
      id: 'minted',
      meta: {
        className: 'font-mono',
      },
      cell: (info) => <PercentageText value={info.getValue()} />,
    }),
    columnHelper.accessor(
      'marketplace_cft20_details_aggregate.aggregate.count',
      {
        meta: {
          className: 'font-mono',
        },
        header: 'Listings',
        enableSorting: false,
        cell: (info) => info.getValue(),
      },
    ),
    columnHelper.accessor('last_price_base', {
      header: 'Token Price',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('volume_24_base', {
      header: 'Volume',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('token_holders', {
      header: 'Actions',
      enableSorting: false,
      cell: (info) => {
        const minted = info.row.getValue<number>('minted')

        const token = info.row.original
        return (
          <>
            <Link
              className="btn btn-primary btn-outline btn-sm mr-4"
              to={`/app/market/${token.ticker}`}
              onClick={(e) => e.stopPropagation()}
            >
              Trade
            </Link>
            {minted < 1 && isTokenLaunched(token) && (
              <Link
                className="btn btn-neutral btn-outline btn-sm mr-4"
                to={`/app/token/${token.ticker}`}
                onClick={(e) => e.stopPropagation()}
              >
                Mint
              </Link>
            )}
          </>
        )
      },
    }),
  ]

  const table = useReactTable<TokenMarket>({
    columns,
    data: data.tokens,
    pageCount: data.pages,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  })

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <Stat title="ATOM / USD" className="max-w-80">
          <NumericFormat
            className="font-mono"
            prefix="$"
            displayType="text"
            value={baseTokenUsd}
          />
        </Stat>
        <Form method="get">
          <DaisyForm.Label
            className="input input-bordered flex items-center gap-2"
            htmlFor="search"
          >
            <input
              type="text"
              id="search"
              name="search"
              className="grow"
              placeholder="Search by name or ticker"
              defaultValue={defaultSearch}
            />
            <MagnifyingGlassIcon className="size-5" />
          </DaisyForm.Label>
        </Form>
      </div>
      <Table
        className="mt-4"
        table={table}
        emptyText="No tokens found"
        total={data.total}
        onClick={(tokenSelection) =>
          navigate(`/app/token/${tokenSelection.ticker}`)
        }
      />
    </>
  )
}
