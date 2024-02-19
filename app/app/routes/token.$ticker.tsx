import { order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { PropsWithChildren } from 'react'
import { Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import Address from '~/components/Address'
import AddressChip from '~/components/AddressChip'
import AtomValue from '~/components/AtomValue'
import InscriptionImage from '~/components/InscriptionImage'
import TxLink from '~/components/TxLink'
import Table from '~/components/table'
import { useRootContext } from '~/context/root'
import useSorting from '~/hooks/useSorting'
import { AsteroidService, TokenDetail, TokenHolder } from '~/services/asteroid'
import { DATETIME_FORMAT } from '~/utils/date'
import { round2 } from '~/utils/math'
import { getDecimalValue, getSupplyTitle } from '~/utils/number'
import { parseSorting } from '~/utils/pagination'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)

  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const token = await asteroidService.getToken(params.ticker, true)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const { sort, direction } = parseSorting(
    new URL(request.url).searchParams,
    'amount',
    order_by.desc,
  )

  const holders = await asteroidService.getTokenHolders(token.id, 0, 100, {
    [sort]: direction,
  })

  return json({ token, holders })
}

function TokenDetailComponent({ token }: { token: TokenDetail }) {
  return (
    <div className="flex flex-row w-full">
      <div className="flex flex-1 flex-col px-16 items-center">
        <InscriptionImage
          mime="image/png"
          src={token.content_path!}
          // isExplicit={token.is_explicit} @todo
          className="rounded-xl w-2/3"
        />
      </div>
      <div className="flex flex-col flex-1">
        <h2 className="font-medium text-lg">{token.name}</h2>
        <span className="mt-2">{token.ticker}</span>
        <Divider />
        <div className="flex flex-row w-full">
          <div className="flex flex-col flex-1">
            <strong className="mb-1">Created by</strong>
            <AddressChip address={token.creator} />
          </div>
          <div className="flex flex-col flex-1">
            <strong className="mb-1">Owned by</strong>
            <AddressChip address={token.current_owner} />
          </div>
        </div>
        <div className="flex flex-col mt-6">
          <strong>Created on</strong>
          <span>{format(token.date_created, DATETIME_FORMAT)}</span>
          <span>Block {token.height}</span>
        </div>
        <div className="flex flex-col mt-6">
          <strong>Transaction</strong>
          <TxLink txHash={token.transaction.hash} />
        </div>
      </div>
    </div>
  )
}

function Row({ children }: PropsWithChildren) {
  return <div className="flex flex-row w-full mt-4">{children}</div>
}

function Column({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col flex-1">
      <strong className="mb-1">{title}</strong>
      {children}
    </div>
  )
}

function Tokenomics({ token }: { token: TokenDetail }) {
  const {
    status: { baseTokenUsd },
  } = useRootContext()
  const now = new Date().getTime() / 1000
  const tokenIsLaunched = now > token.launch_timestamp

  return (
    <div>
      <Row>
        <Column title="Max supply">
          <NumericFormat
            displayType="text"
            thousandSeparator
            value={getDecimalValue(token.max_supply, token.decimals)}
          />
        </Column>
        <Column title="Circulating">
          <span>
            {getSupplyTitle(getDecimalValue(token.max_supply, token.decimals))}{' '}
            ({round2((token.circulating_supply / token.max_supply) * 100)}%)
          </span>
        </Column>
      </Row>
      <Row>
        <Column title="Price">
          <AtomValue value={token.last_price_base} />
        </Column>
        <Column title="Market cap">
          <NumericFormat
            displayType="text"
            thousandSeparator
            prefix="$"
            value={
              getDecimalValue(token.circulating_supply, token.decimals) *
              (baseTokenUsd *
                getDecimalValue(token.last_price_base, token.decimals))
            }
          />
        </Column>
      </Row>
      <Row>
        <Column title="Limit per mint">
          <NumericFormat
            displayType="text"
            thousandSeparator
            value={getDecimalValue(token.per_mint_limit, token.decimals)}
          />
        </Column>
        <Column title={tokenIsLaunched ? 'Launched at' : 'Launching'}>
          <span>{format(token.launch_timestamp, DATETIME_FORMAT)}</span>
        </Column>
      </Row>
    </div>
  )
}

const DEFAULT_SORT = { id: 'amount', desc: true }

function TokenHolders({
  token,
  holders,
}: {
  token: TokenDetail
  holders: TokenHolder[]
}) {
  const columnHelper = createColumnHelper<TokenHolder>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const navigate = useNavigate()

  const columns = [
    columnHelper.accessor('id', {
      header: 'Holder #',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      cell: (info) => <Address address={info.getValue()} />,
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => getDecimalValue(info.getValue(), token.decimals),
    }),
  ]

  const table = useReactTable<TokenHolder>({
    columns,
    data: holders,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  return (
    <Table
      table={table}
      showPagination={false}
      onClick={(holder) => navigate(`/wallet/${holder.address}`)}
    />
  )
}

export default function TokenPage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-col">
      <TokenDetailComponent token={data.token} />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Tokenomics</h2>
      <Divider />
      <Tokenomics token={data.token} />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Holders</h2>
      <Divider />
      <TokenHolders token={data.token} holders={data.holders} />
    </div>
  )
}
