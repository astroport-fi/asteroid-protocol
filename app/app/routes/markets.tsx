import { order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import AtomValue from '~/components/AtomValue'
import SellTokenDialog from '~/components/dialogs/SellTokenDialog'
import Table from '~/components/table'
import useDialog from '~/hooks/useDialog'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { AsteroidService, TokenMarket } from '~/services/asteroid'
import { getAddress } from '~/utils/cookies'
import { parsePagination, parseSorting } from '~/utils/pagination'

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
  const columnHelper = createColumnHelper<TokenMarket>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()
  const { dialogRef, handleShow } = useDialog()
  const [selected, setSelected] = useState<{ ticker: string; amount: number }>({
    ticker: '',
    amount: 0,
  })

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
        const amount = value[0]?.amount
        return amount ? (
          <Button
            color="neutral"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelected({ ticker: info.row.original.ticker, amount })
              handleShow()
            }}
          >
            Sell
          </Button>
        ) : (
          ''
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
      <Table
        table={table}
        onClick={(tokenSelection) =>
          navigate(`/market/${tokenSelection.ticker}`)
        }
      />
      <SellTokenDialog
        ticker={selected.ticker}
        tokenAmount={selected.amount}
        ref={dialogRef}
      />
    </>
  )
}
