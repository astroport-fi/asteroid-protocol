import { order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from 'react-daisyui'
import AtomValue from '~/components/AtomValue'
import Table from '~/components/table'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { AsteroidService } from '~/services/asteroid'
import { getAddress } from '~/utils/cookies'
import { parsePagination, parseSorting } from '~/utils/pagination'
import type { ArrayElement } from '~/utils/types'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'id',
    order_by.desc,
  )

  const address = await getAddress(request)

  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const tokens = await asteroidService.getTokenMarkets(
    offset,
    limit,
    { userAddress: address },
    {
      [sort]: direction,
    },
  )
  // @todo total
  const total = 500

  return json({
    tokens: tokens,
    pages: Math.ceil(total / limit),
  })
}

const DEFAULT_SORT = { id: 'id', desc: true }

export default function MarketsPage() {
  const data = useLoaderData<typeof loader>()
  type Markets = typeof data
  type Market = ArrayElement<Markets['tokens']>
  const columnHelper = createColumnHelper<Market>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()

  const columns = [
    columnHelper.accessor('ticker', {
      header: 'Market',
      cell: (info) => `${info.getValue()} / ATOM`,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor(
      'marketplace_cft20_details_aggregate.aggregate.count',
      {
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
    // @todo open sell modal
    columnHelper.accessor('token_holders', {
      header: '',
      enableSorting: false,
      cell: (info) => {
        const value = info.getValue()
        if (!info.getValue()) {
          return ''
        }
        return value[0]?.amount ? (
          <Button
            color="neutral"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          >
            Sell
          </Button>
        ) : (
          ''
        )
      },
    }),
  ]

  const table = useReactTable<Market>({
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
    <Table
      table={table}
      onClick={(tokenSelection) => navigate(`/market/${tokenSelection.ticker}`)}
    />
  )
}
