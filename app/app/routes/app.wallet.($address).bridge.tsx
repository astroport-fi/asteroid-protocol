import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { Link, json, useLoaderData } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { BridgeHistory } from '~/api/bridge'
import { AsteroidClient } from '~/api/client'
import Address from '~/components/Address'
import GhostEmptyState from '~/components/GhostEmptyState'
import TokenValue from '~/components/TokenValue'
import TxLink from '~/components/TxLink'
import Table from '~/components/table'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT } from '~/utils/date'
import { parsePagination, parseSorting } from '~/utils/pagination'

const DEFAULT_SORT = { id: 'height', desc: true }

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const { searchParams } = new URL(request.url)
  const { offset, limit } = parsePagination(searchParams)
  const { sort, direction } = parseSorting(
    searchParams,
    DEFAULT_SORT.id,
    order_by.desc,
  )

  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ history: [], pages: 0, total: 0 })
  }
  const res = await asteroidClient.getBridgeHistory(address, offset, limit, {
    [sort]: direction,
  })

  return json({
    history: res.history,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

function BridgeHistoryTable({
  history,
  pages,
  total,
}: {
  history: BridgeHistory[]
  pages: number
  total: number
}) {
  const columnHelper = createColumnHelper<BridgeHistory>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()

  const columns = [
    columnHelper.accessor('date_created', {
      header: 'Date',
      cell: (info) => format(info.getValue(), DATETIME_FORMAT),
    }),
    columnHelper.accessor('height', {
      header: 'Block',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => (
        <TokenValue
          amount={info.getValue()}
          decimals={info.row.original.token.decimals}
          price={info.row.original.token.last_price_base}
          ticker={info.row.original.token.ticker}
        />
      ),
    }),
    columnHelper.accessor('sender', {
      header: 'Sender',
      cell: (info) => <Address address={info.getValue()} />,
    }),
    columnHelper.accessor('receiver', {
      header: 'Receiver',
      cell: (info) => <Address address={info.getValue() as string} />,
    }),
    columnHelper.accessor('transaction.hash', {
      header: '',
      enableSorting: false,
      cell: (info) => (
        <TxLink txHash={info.getValue()} title="View on Mintscan" />
      ),
    }),
    columnHelper.accessor((row) => row.transaction.hash, {
      enableSorting: false,
      header: '',
      id: 'check',
      cell: (info) => (
        <Link to={`/app/bridge?tx=${info.getValue()}`} className="text-primary">
          Verify transaction
        </Link>
      ),
    }),
  ]

  const table = useReactTable<BridgeHistory>({
    columns,
    data: history,
    pageCount: pages,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  })

  return <Table table={table} total={total} className="no-scrollbar" />
}

export default function WalletTransactions() {
  const data = useLoaderData<typeof loader>()

  if (data.history.length < 1) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/bridge" className="btn btn-primary">
            Bridge tokens
          </Link>
        </div>
      </GhostEmptyState>
    )
  }

  return (
    <BridgeHistoryTable
      history={data.history}
      pages={data.pages}
      total={data.total}
    />
  )
}
