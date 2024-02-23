import { order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Divider } from 'react-daisyui'
import Address from '~/components/Address'
import InscriptionImage from '~/components/InscriptionImage'
import { TokenActions } from '~/components/TokenActions'
import TokenBalance from '~/components/TokenBalance'
import TxLink from '~/components/TxLink'
import Table from '~/components/table'
import useSorting from '~/hooks/useSorting'
import {
  AsteroidService,
  Token,
  TokenAddressHistory,
  TokenTypeWithHolder,
} from '~/services/asteroid'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { parseSorting } from '~/utils/pagination'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }

  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const token = await asteroidService.getToken(params.ticker, false, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  if (!address) {
    return json({ token, history: [] })
  }

  const { sort, direction } = parseSorting(
    new URL(request.url).searchParams,
    'height',
    order_by.desc,
  )

  const history = await asteroidService.getTokenAddressHistory(
    token.id,
    address,
    {
      [sort]: direction,
    },
  )

  return json({ token, history })
}
function TokenDetail({ token }: { token: TokenTypeWithHolder<Token> }) {
  const amount = token.token_holders?.[0]?.amount

  return (
    <div className="flex flex-row w-full">
      <div className="flex flex-1 flex-col px-16 items-center">
        <InscriptionImage
          mime="image/png"
          src={token.content_path!}
          // isExplicit={token.is_explicit} @todo
          className="rounded-xl max-w-60"
        />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <h2 className="font-medium text-lg">{token.name}</h2>
            <span className="mt-1">{token.ticker}</span>
          </div>
          <TokenActions token={token} amount={amount} />
        </div>
        <TokenBalance token={token} amount={amount} className="mt-2" />
      </div>
    </div>
  )
}

const DEFAULT_SORT = { id: 'height', desc: true }

function TokenAddressHistoryComponent({
  history,
  token,
}: {
  token: Token
  history: TokenAddressHistory[]
}) {
  const columnHelper = createColumnHelper<TokenAddressHistory>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)

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
      cell: (info) => getDecimalValue(info.getValue(), token.decimals),
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
  ]

  const table = useReactTable<TokenAddressHistory>({
    columns,
    data: history,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  return <Table table={table} showPagination={false} />
}

export default function WalletToken() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-col">
      <TokenDetail token={data.token} />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Transaction History</h2>
      <Divider />
      <TokenAddressHistoryComponent token={data.token} history={data.history} />
    </div>
  )
}
