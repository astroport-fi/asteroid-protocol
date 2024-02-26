import { order_by } from '@asteroid-protocol/sdk'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import { TokenDetail, TokenHolder, TokenTypeWithHolder } from '~/api/token'
import Address from '~/components/Address'
import AddressChip from '~/components/AddressChip'
import InscriptionImage from '~/components/InscriptionImage'
import MintToken from '~/components/MintToken'
import { TokenActions } from '~/components/TokenActions'
import TokenBalance from '~/components/TokenBalance'
import Tokenomics from '~/components/Tokenomics'
import TxLink from '~/components/TxLink'
import Table from '~/components/table'
import useSorting from '~/hooks/useSorting'
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

  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, true, address)

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

  const holders = await asteroidClient.getTokenHolders(token.id, 0, 100, {
    [sort]: direction,
  })

  return json({ token, holders })
}

function TokenDetailComponent({
  token,
}: {
  token: TokenTypeWithHolder<TokenDetail>
}) {
  const amount = token.token_holders?.[0]?.amount

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
        <div className="flex flex-row justify-between">
          <h2 className="font-medium text-2xl">{token.name}</h2>
          <div className="flex items-center">
            {token.circulating_supply < token.max_supply && (
              <>
                <MintToken
                  amount={token.per_mint_limit}
                  ticker={token.ticker}
                />
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
        <TokenActions token={token} amount={amount} />
      </div>
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
      onClick={(holder) => navigate(`/app/wallet/${holder.address}`)}
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
      <Tokenomics token={data.token} showPrice />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Holders</h2>
      <Divider />
      <TokenHolders token={data.token} holders={data.holders} />
    </div>
  )
}
