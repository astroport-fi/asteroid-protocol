import { order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import AtomValue from '~/components/AtomValue'
import Table from '~/components/table'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { AsteroidService, Token } from '~/services/asteroid'
import { round1 } from '~/utils/math'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'date_created',
    order_by.desc,
  )

  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const tokens = await asteroidService.getTokens(
    offset,
    limit,
    {},
    { [sort]: direction },
  )
  // @todo total
  const total = 500

  return json({
    tokens: tokens,
    pages: Math.ceil(total / limit),
  })
}

const DEFAULT_SORT = { id: 'date_created', desc: true }

export default function TokensPage() {
  const data = useLoaderData<typeof loader>()
  const columnHelper = createColumnHelper<Token>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()

  const columns = [
    columnHelper.accessor('id', {
      header: '#',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('ticker', {
      header: 'Ticker',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('last_price_base', {
      header: 'Token Price',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor(
      (row) => (row.circulating_supply / row.max_supply) * 100,
      {
        enableSorting: false,
        header: 'Minted',
        id: 'minted',
        cell: (info) => `${round1(info.getValue())}%`,
      },
    ),
  ]

  const table = useReactTable<Token>({
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
      onClick={(tokenSelection) =>
        navigate(`/app/token/${tokenSelection.ticker}`)
      }
    />
  )
}
