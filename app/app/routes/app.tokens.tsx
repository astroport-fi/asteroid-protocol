import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import { TokenMarket } from '~/api/token'
import AtomValue from '~/components/AtomValue'
import InscriptionImage from '~/components/InscriptionImage'
import SellTokenDialog from '~/components/dialogs/SellTokenDialog'
import Table from '~/components/table'
import useDialog from '~/hooks/useDialog'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { round1 } from '~/utils/math'
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

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getTokenMarkets(
    offset,
    limit,
    { userAddress: address },
    {
      [sort]: direction,
    },
  )

  return json({
    tokens: res.tokens,
    pages: Math.ceil(res.count / limit),
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
    columnHelper.accessor('content_path', {
      header: '#',
      cell: (info) => (
        <InscriptionImage
          mime="image/png"
          src={info.getValue()!}
          // isExplicit={token.is_explicit} @todo
          className="rounded-xl w-6"
        />
      ),
    }),
    columnHelper.accessor('id', {
      header: '#',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('ticker', {
      header: 'Ticker',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => row.circulating_supply / row.max_supply, {
      enableSorting: false,
      header: 'Minted',
      id: 'minted',
      cell: (info) => `${round1(info.getValue() * 100)}%`,
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
      header: 'Actions',
      enableSorting: false,
      cell: (info) => {
        const minted = info.row.getValue<number>('minted')

        const value = info.getValue()
        const amount = value?.[0]?.amount ?? 0
        return (
          <>
            {minted < 1 && (
              <Link
                className="btn btn-neutral btn-sm mr-2"
                to={`/app/token/${info.row.original.ticker}`}
                onClick={(e) => e.stopPropagation()}
              >
                Mint
              </Link>
            )}
            {amount > 0 && (
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
      <Table
        table={table}
        onClick={(tokenSelection) =>
          navigate(`/app/market/${tokenSelection.ticker}`)
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
