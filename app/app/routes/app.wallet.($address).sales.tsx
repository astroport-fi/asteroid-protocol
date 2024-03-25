import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { useReactTable } from '@tanstack/react-table'
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core'
import { format } from 'date-fns'
import { AsteroidClient } from '~/api/client'
import { TradeHistory } from '~/api/trade-history'
import Address from '~/components/Address'
import DecimalText from '~/components/DecimalText'
import GhostEmptyState from '~/components/GhostEmptyState'
import InscriptionImage from '~/components/InscriptionImage'
import Table from '~/components/table'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT } from '~/utils/date'
import { parsePagination, parseSorting } from '~/utils/pagination'

const DEFAULT_SORT = { id: 'date_created', desc: true }

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
  const res = await asteroidClient.getTradeHistory(address, offset, limit, {
    [sort]: direction,
  })

  return json({
    history: res.history,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

enum TransactionKind {
  Token,
  Inscription,
}

function WalletTransactionsTable({
  history,
  pages,
  total,
}: {
  history: TradeHistory[]
  pages: number
  total: number
}) {
  const columnHelper = createColumnHelper<TradeHistory>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()

  const columns = [
    columnHelper.accessor('date_created', {
      header: 'Date',
      cell: (info) => format(info.getValue(), DATETIME_FORMAT),
    }),
    columnHelper.accessor(
      (row) => {
        if (row.inscription) {
          return TransactionKind.Inscription
        }
        return TransactionKind.Token
      },
      {
        enableSorting: false,
        header: 'Type',
        cell: (info) => {
          if (info.getValue() === TransactionKind.Inscription) {
            return 'Inscription'
          }
          return 'Token'
        },
      },
    ),
    columnHelper.accessor(
      (row) => {
        if (row.inscription) {
          return TransactionKind.Inscription
        }
        return TransactionKind.Token
      },
      {
        enableSorting: false,
        header: 'Item',
        id: 'detail',
        cell: (info) => {
          const { inscription, token, amount_base } = info.row.original

          if (inscription) {
            return (
              <InscriptionImage
                min
                mime={inscription.mime}
                src={inscription.content_path}
                isExplicit={inscription.is_explicit}
                imageClassName="rounded-xl"
                className="size-8"
              />
            )
          }
          return (
            <DecimalText value={amount_base} suffix={` ${token?.ticker}`} />
          )
        },
      },
    ),
    columnHelper.accessor('amount_quote', {
      header: 'Price',
      cell: (info) => (
        <div className="flex flex-col">
          <DecimalText value={info.getValue()} suffix=" ATOM" />
          <DecimalText
            value={info.row.original.total_usd}
            className="font-mono text-sm text-header-content font-light mt-0.5"
            decimals={0}
            prefix="$"
          />
        </div>
      ),
    }),
    columnHelper.accessor('buyer_address', {
      header: 'Buyer',
      cell: (info) => (
        <Link
          to={`/app/wallet/${info.getValue()}`}
          className="shrink-0 w-2/12 hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Address address={info.getValue()} />
        </Link>
      ),
    }),
  ]

  const table = useReactTable<TradeHistory>({
    columns,
    data: history,
    pageCount: pages,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <Table
      table={table}
      total={total}
      onClick={(selection) => {
        if (selection.inscription) {
          navigate(`/app/inscription/${selection.inscription.transaction.hash}`)
        } else if (selection.token) {
          navigate(`/app/token/${selection.token.ticker}`)
        }
      }}
    />
  )
}

export default function WalletTransactions() {
  const data = useLoaderData<typeof loader>()

  if (data.history.length < 1) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/create/token" className="btn btn-primary">
            Create token
          </Link>
          <Link to="/app/create/inscription" className="btn btn-primary ml-4">
            Create inscription
          </Link>
        </div>
      </GhostEmptyState>
    )
  }

  return (
    <WalletTransactionsTable
      pages={data.pages}
      total={data.total}
      history={data.history as TradeHistory[]}
    />
  )
}
