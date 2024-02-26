import { ValueTypes, order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AsteroidClient } from '~/api/client'
import { TokenHolding } from '~/api/token'
import AtomValue from '~/components/AtomValue'
import TokenValue from '~/components/TokenValue'
import Table from '~/components/table'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'amount',
    order_by.desc,
  )

  let orderBy: ValueTypes['token_holder_order_by']
  if (sort === 'token_name') {
    orderBy = {
      token: {
        name: direction,
      },
    }
  } else if (sort === 'token_last_price_base') {
    orderBy = {
      token: {
        last_price_base: direction,
      },
    }
  } else {
    orderBy = {
      [sort]: direction,
    }
  }

  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ tokens: [], pages: 0 })
  }

  const asteroidClient = new AsteroidClient(context.env.ASTEROID_API)
  const tokens = await asteroidClient.getTokenHoldings(
    address,
    offset,
    limit,
    null,
    orderBy,
  )
  // @todo total
  const total = 500

  return json({
    tokens: tokens,
    pages: Math.ceil(total / limit),
  })
}

const DEFAULT_SORT = { id: 'amount', desc: true }

export default function WalletTokens() {
  const data = useLoaderData<typeof loader>()
  const columnHelper = createColumnHelper<TokenHolding>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()

  const columns = [
    columnHelper.accessor('token.name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('token.last_price_base', {
      header: 'Price',
      cell: (info) => <AtomValue value={info.getValue()} />,
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
  ]

  const table = useReactTable<TokenHolding>({
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
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <Table
      table={table}
      onClick={(tokenSelection) =>
        navigate(`/app/wallet/token/${tokenSelection.token.ticker}`)
      }
    />
  )
}
