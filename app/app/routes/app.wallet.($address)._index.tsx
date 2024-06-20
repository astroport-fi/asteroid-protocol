import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AsteroidClient } from '~/api/client'
import { TokenHolding } from '~/api/token'
import AtomValue from '~/components/AtomValue'
import GhostEmptyState from '~/components/GhostEmptyState'
import { TokenCell } from '~/components/TokenCell'
import TokenValue from '~/components/TokenValue'
import Table from '~/components/table'
import { useRootContext } from '~/context/root'
import { useNeutronAddress } from '~/hooks/useAddress'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { useAllBalances } from '~/hooks/useTokenFactory'
import { getAddress } from '~/utils/cookies'
import { parsePagination, parseSorting } from '~/utils/pagination'
import { getDenom } from '~/utils/token-factory'

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
    return json({ tokens: [], pages: 0, total: 0 })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const result = await asteroidClient.getTokenHoldings(
    address,
    offset,
    limit,
    null,
    orderBy,
  )

  return json({
    tokens: result.holdings,
    pages: Math.ceil(result.count / limit),
    total: result.count,
  })
}

const DEFAULT_SORT = { id: 'amount', desc: true }

export default function WalletTokens() {
  const data = useLoaderData<typeof loader>()
  const columnHelper = createColumnHelper<TokenHolding>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()
  const neutronAddress = useNeutronAddress()
  const neutronBalances = useAllBalances(neutronAddress)
  const neutronBalancesByTicker = neutronBalances?.reduce(
    (map, balance) => map.set(balance.denom, parseInt(balance.amount)),
    new Map<string, number>(),
  )
  const { neutronBridgeContract } = useRootContext()

  const columns = [
    columnHelper.accessor('token.name', {
      header: 'Name',
      cell: (info) => <TokenCell token={info.row.original.token} />,
    }),
    columnHelper.accessor('amount', {
      header: 'Balance',
      cell: (info) => (
        <TokenValue
          amount={info.getValue()}
          decimals={info.row.original.token.decimals}
          price={info.row.original.token.last_price_base}
          ticker={info.row.original.token.ticker}
        />
      ),
    }),
    columnHelper.accessor('token.ticker', {
      header: 'Bridged balance',
      enableSorting: false,
      cell: (info) => {
        if (!neutronBalancesByTicker) {
          return
        }
        const ticker = info.getValue()
        const balance = neutronBalancesByTicker.get(
          getDenom(neutronBridgeContract, ticker),
        )
        return (
          <TokenValue
            amount={balance ?? 0}
            decimals={info.row.original.token.decimals}
            price={info.row.original.token.last_price_base}
            ticker={ticker}
          />
        )
      },
    }),
    columnHelper.accessor('token.last_price_base', {
      header: 'Price',
      cell: (info) => <AtomValue value={info.getValue()} />,
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

  if (data.tokens.length < 1) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/create/token" className="btn btn-primary">
            Create token
          </Link>
          <Link to="/app/tokens" className="btn btn-primary ml-4">
            Buy tokens
          </Link>
        </div>
      </GhostEmptyState>
    )
  }

  return (
    <Table
      table={table}
      total={data.total}
      onClick={(tokenSelection) =>
        navigate(`/app/wallet/token/${tokenSelection.token.ticker}`)
      }
    />
  )
}
