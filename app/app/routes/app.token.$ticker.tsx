import { order_by } from '@asteroid-protocol/sdk/client'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { AsteroidClient } from '~/api/client'
import {
  TokenDetail,
  TokenHolder,
  TokenTypeWithHolder,
  isTokenLaunched,
} from '~/api/token'
import Address from '~/components/Address'
import AddressChip from '~/components/AddressChip'
import { BackHeader } from '~/components/Back'
import InscriptionImage from '~/components/InscriptionImage'
import MintToken from '~/components/MintToken'
import { TokenActions } from '~/components/TokenActions'
import TokenBalance from '~/components/TokenBalance'
import Tokenomics from '~/components/Tokenomics'
import TxLink from '~/components/TxLink'
import Table from '~/components/table'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT } from '~/utils/date'
import { tokenMeta } from '~/utils/meta'
import { getDecimalValue } from '~/utils/number'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, true, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const { searchParams } = new URL(request.url)
  const { sort, direction } = parseSorting(
    searchParams,
    'amount',
    order_by.desc,
  )
  const { offset, limit } = parsePagination(searchParams)

  const res = await asteroidClient.getTokenHolders(token.id, offset, limit, {
    [sort]: direction,
  })

  return json({
    token,
    holders: res.holders,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return []
  }

  return tokenMeta(data.token)
}

function TokenDetailComponent({
  token,
}: {
  token: TokenTypeWithHolder<TokenDetail>
}) {
  const amount = token.token_holders?.[0]?.amount

  return (
    <div className="flex flex-col xl:flex-row w-full mt-4">
      <div className="flex flex-1 flex-col xl:px-16 pb-8 items-center justify-center">
        <InscriptionImage
          mime="image/png"
          src={token.content_path!}
          // isExplicit={token.is_explicit} @todo
          className="rounded-xl w-fit h-fit max-w-lg items-center justify-center object-contain"
        />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row justify-between">
          <h2 className="font-medium text-2xl">{token.name}</h2>
          <div className="flex items-center">
            {token.circulating_supply < token.max_supply && (
              <>
                {isTokenLaunched(token) && <MintToken token={token} />}
                <Link
                  to={`/mint/${token.ticker}`}
                  className="text-primary flex items-center ml-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open mint page{' '}
                  <ArrowTopRightOnSquareIcon className="size-5 ml-1" />
                </Link>
              </>
            )}
          </div>
        </div>
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
        <TokenBalance token={token} amount={amount} className="mt-6" />
        <TokenActions token={token} amount={amount} className="mt-4" />
      </div>
    </div>
  )
}

const DEFAULT_SORT = { id: 'amount', desc: true }

function TokenHolders({
  token,
  holders,
  pages,
  total,
}: {
  token: TokenDetail
  holders: TokenHolder[]
  pages: number
  total: number
}) {
  const columnHelper = createColumnHelper<TokenHolder>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
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
      cell: (info) => (
        <NumericFormat
          className="font-mono"
          value={getDecimalValue(info.getValue(), token.decimals)}
          thousandSeparator
          displayType="text"
          decimalScale={6}
        />
      ),
    }),
  ]

  const table = useReactTable<TokenHolder>({
    columns,
    data: holders,
    pageCount: pages,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  })

  return (
    <Table
      table={table}
      total={total}
      onClick={(holder) => navigate(`/app/wallet/${holder.address}`)}
    />
  )
}

export default function TokenPage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-col">
      <BackHeader to="/app/tokens">Token #{data.token.id}</BackHeader>
      <TokenDetailComponent token={data.token} />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Tokenomics</h2>
      <Divider />
      <Tokenomics token={data.token} showPrice />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Holders</h2>
      <Divider />
      {data.holders.length > 0 ? (
        <TokenHolders
          token={data.token}
          holders={data.holders}
          pages={data.pages}
          total={data.total}
        />
      ) : (
        <span>Token has no holders</span>
      )}
    </div>
  )
}
