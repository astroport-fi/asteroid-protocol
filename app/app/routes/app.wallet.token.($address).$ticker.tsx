import type { TxInscription } from '@asteroid-protocol/sdk'
import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Button, Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { AsteroidClient } from '~/api/client'
import {
  ListingState,
  OldMarketplaceListing,
  getListingState,
} from '~/api/marketplace'
import {
  MarketplaceTokenListing,
  Token,
  TokenAddressHistory,
  TokenTypeWithHolder,
} from '~/api/token'
import Address from '~/components/Address'
import AtomValue from '~/components/AtomValue'
import { BackHeader } from '~/components/Back'
import InscriptionImage from '~/components/InscriptionImage'
import { TokenActions } from '~/components/TokenActions'
import TokenBalance from '~/components/TokenBalance'
import TxLink from '~/components/TxLink'
import TxDialog from '~/components/dialogs/TxDialog'
import Table from '~/components/table'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import {
  useCFT20Operations,
  useMarketplaceOperations,
} from '~/hooks/useOperations'
import useSorting from '~/hooks/useSorting'
import useAddress from '~/hooks/wallet/useAddress'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { parseSorting } from '~/utils/pagination'
import { getTokenMarketplaceListingSort } from './app.market.$ticker'

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

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, false, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  if (!address) {
    return json({
      token,
      history: [] as TokenAddressHistory[],
      listings: [],
      oldListings: [],
    })
  }

  const { sort, direction } = parseSorting(
    new URL(request.url).searchParams,
    'height',
    order_by.desc,
    'history',
  )

  const history = await asteroidClient.getTokenAddressHistory(
    token.id,
    address,
    {
      [sort]: direction,
    },
  )

  const { sort: listingsSort, direction: listingsDirection } = parseSorting(
    new URL(request.url).searchParams,
    'listing_id',
    order_by.desc,
    'listings',
  )

  const listingsResult = await asteroidClient.getTokenListings(
    token.id,
    0,
    500,
    getTokenMarketplaceListingSort(listingsSort, listingsDirection),
    false,
    { seller: address },
  )

  const oldListingsResult = await asteroidClient.getOldMarketplaceListings(
    token.id,
    address,
  )

  return json({
    token,
    history,
    listings: listingsResult.listings,
    oldListings: oldListingsResult,
  })
}

function TokenDetail({ token }: { token: TokenTypeWithHolder<Token> }) {
  const amount = token.token_holders?.[0]?.amount

  return (
    <div className="flex flex-row w-full mt-8">
      <div className="flex flex-1 flex-col px-16 items-center">
        <InscriptionImage
          mime="image/png"
          src={token.content_path!}
          // isExplicit={token.is_explicit} @todo
          imageClassName="rounded-xl"
          className="max-w-60"
        />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <h2 className="font-medium text-2xl">{token.name}</h2>
            <span className="mt-1">{token.ticker}</span>
          </div>
          <TokenActions token={token} amount={amount} />
        </div>
        <TokenBalance token={token} amount={amount} className="mt-4" />
      </div>
    </div>
  )
}

const LISTING_DEFAULT_SORT = { id: 'listing_id', desc: false }

function ListingsTable({
  token,
  listings,
  className,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  className?: string
}) {
  const columnHelper = createColumnHelper<MarketplaceTokenListing>()
  const [sorting, setSorting] = useSorting(LISTING_DEFAULT_SORT, 'listings')
  const {
    status: { lastKnownHeight },
  } = useRootContext()
  const {
    dialogRef: txDialogRef,
    value,
    showDialog: showTxDialog,
  } = useDialogWithValue<TxInscription>()
  const operations = useMarketplaceOperations()
  const address = useAddress()

  function cancelListing(listingHash: string) {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)
    showTxDialog(txInscription)
  }

  const columns = [
    columnHelper.accessor('id', {
      header: 'Listing #',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('ppt', {
      header: 'ATOM per Token',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('amount', {
      header: `${token.ticker} Tokens`,
      cell: (info) => (
        <NumericFormat
          className="font-mono"
          displayType="text"
          thousandSeparator
          value={getDecimalValue(info.getValue(), token.decimals)}
        />
      ),
    }),
    columnHelper.accessor('marketplace_listing.total', {
      header: 'Total Atom',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('marketplace_listing.transaction.hash', {
      enableSorting: false,
      header: '',
      id: 'state',
      cell: (info) => {
        const listing = info.row.original.marketplace_listing
        const blocks = (listing.depositor_timedout_block ?? 0) - lastKnownHeight
        const listingHash = listing.transaction.hash

        switch (
          getListingState(
            info.row.original.marketplace_listing,
            address,
            lastKnownHeight,
          )
        ) {
          case ListingState.Cancel:
            return (
              <Button
                color="neutral"
                size="sm"
                onClick={() => cancelListing(listingHash)}
              >
                Cancel
              </Button>
            )
          case ListingState.Reserved:
            return (
              <Button
                color="neutral"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                Reserved ({blocks})
              </Button>
            )
        }
      },
    }),
  ]

  const table = useReactTable<MarketplaceTokenListing>({
    columns,
    data: listings,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  return (
    <>
      <Table table={table} className={className} showPagination={false} />
      <TxDialog
        ref={txDialogRef}
        txInscription={value}
        resultCTA="Back to token detail"
        resultLink={`/app/wallet/token/${token.ticker}`}
      />
    </>
  )
}

function OldListingsTable({
  token,
  listings,
  className,
}: {
  token: Token
  listings: OldMarketplaceListing[]
  className?: string
}) {
  const columnHelper = createColumnHelper<OldMarketplaceListing>()
  const {
    dialogRef: txDialogRef,
    value,
    showDialog: showTxDialog,
  } = useDialogWithValue<TxInscription>()
  const address = useAddress()
  const operations = useCFT20Operations()

  function cancelListing(orderId: number) {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(token.ticker, orderId)
    showTxDialog(txInscription)
  }

  const columns = [
    columnHelper.accessor('id', {
      header: 'Listing #',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('ppt', {
      header: 'ATOM per Token',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('amount', {
      header: `${token.ticker} Tokens`,
      cell: (info) => (
        <NumericFormat
          className="font-mono"
          displayType="text"
          thousandSeparator
          value={getDecimalValue(info.getValue(), token.decimals)}
        />
      ),
    }),
    columnHelper.accessor('total', {
      header: 'Total Atom',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('transaction.hash', {
      enableSorting: false,
      header: '',
      id: 'state',
      cell: (info) => {
        if (info.row.original.seller_address !== address) {
          return
        }

        return (
          <Button
            color="neutral"
            size="sm"
            onClick={() => cancelListing(info.row.original.id)}
          >
            Cancel
          </Button>
        )
      },
    }),
  ]

  const table = useReactTable<OldMarketplaceListing>({
    columns,
    data: listings,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <Table table={table} className={className} showPagination={false} />
      <TxDialog
        ref={txDialogRef}
        txInscription={value}
        resultCTA="Back to token detail"
        resultLink={`/app/wallet/token/${token.ticker}`}
      />
    </>
  )
}

const HISTORY_DEFAULT_SORT = { id: 'height', desc: true }

function TokenAddressHistoryComponent({
  history,
  token,
}: {
  token: Token
  history: TokenAddressHistory[]
}) {
  const columnHelper = createColumnHelper<TokenAddressHistory>()
  const [sorting, setSorting] = useSorting(HISTORY_DEFAULT_SORT, 'history')

  const columns = [
    columnHelper.accessor('date_created', {
      header: 'Date',
      cell: (info) => format(info.getValue(), DATETIME_FORMAT),
    }),
    columnHelper.accessor('height', {
      header: 'Block',
      meta: {
        className: 'font-mono',
      },
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: (info) => info.getValue(),
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
      <BackHeader to="/app/wallet">Manage Token #{data.token.id}</BackHeader>
      <TokenDetail token={data.token} />
      {data.oldListings.length > 0 && (
        <>
          <Divider className="mt-8" />
          <h2 className="font-medium text-lg">
            Your listings from Marketplace V1
          </h2>
          <Divider />
          <OldListingsTable
            token={data.token}
            listings={data.oldListings}
            className="mb-16"
          />
        </>
      )}
      {data.listings.length > 0 && (
        <>
          <Divider className="mt-8" />
          <h2 className="font-medium text-lg">Your listings</h2>
          <Divider />
          <ListingsTable
            token={data.token}
            listings={data.listings}
            className="mb-16"
          />
        </>
      )}
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Transaction History</h2>
      <Divider />
      <TokenAddressHistoryComponent token={data.token} history={data.history} />
    </div>
  )
}
