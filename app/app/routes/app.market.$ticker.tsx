import type { TxInscription } from '@asteroid-protocol/sdk'
import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import {
  TableOptions,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { AsteroidClient } from '~/api/client'
import { ListingState, getListingState } from '~/api/marketplace'
import { MarketplaceTokenListing, Token } from '~/api/token'
import AtomValue from '~/components/AtomValue'
import { BackHeader } from '~/components/Back'
import GhostEmptyState from '~/components/GhostEmptyState'
import InscriptionImage from '~/components/InscriptionImage'
import Stat from '~/components/Stat'
import BuyDialog from '~/components/dialogs/BuyDialog'
import SellTokenDialog from '~/components/dialogs/SellTokenDialog'
import TxDialog from '~/components/dialogs/TxDialog'
import Table from '~/components/table'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useDialog from '~/hooks/useDialog'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { getDateAgo } from '~/utils/date'
import { round2 } from '~/utils/math'
import { getDecimalValue } from '~/utils/number'
import { parsePagination, parseSorting } from '~/utils/pagination'

export function getTokenMarketplaceListingSort(
  sort: string,
  direction: order_by,
): ValueTypes['marketplace_cft20_detail_order_by'] {
  if (sort === 'marketplace_listing_total') {
    return {
      marketplace_listing: {
        total: direction,
      },
    }
  } else if (sort === 'marketplace_listing_deposit_total') {
    return {
      marketplace_listing: {
        deposit_total: direction,
      },
    }
  } else {
    return {
      [sort]: direction,
    }
  }
}

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'ppt',
    order_by.asc,
  )

  const address = await getAddress(request)
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, false, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const orderBy = getTokenMarketplaceListingSort(sort, direction)

  const res = await asteroidClient.getTokenListings(
    token.id,
    offset,
    limit,
    orderBy,
    true,
  )

  if (address) {
    const status = await asteroidClient.getStatus(
      context.cloudflare.env.CHAIN_ID,
    )
    if (status) {
      const reservedListings = await asteroidClient.getTokenListings(
        token.id,
        0,
        100,
        orderBy,
        false,
        { currentBlock: status.last_processed_height, depositor: address },
      )
      return json({
        token,
        listings: res.listings,
        reservedListings: reservedListings.listings,
        pages: Math.ceil(res.count! / limit),
      })
    }
  }

  return json({
    token,
    listings: res.listings,
    reservedListings: [],
    pages: Math.ceil(res.count! / limit),
  })
}

const DEFAULT_SORT = { id: 'ppt', desc: false }

interface Operation {
  inscription: TxInscription
  feeTitle?: string
}

function ListingsTable({
  token,
  listings,
  pages,
  serverSorting,
  className,
  onListClick,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  pages?: number
  serverSorting: boolean
  onListClick: () => void
  className?: string
}) {
  const columnHelper = createColumnHelper<MarketplaceTokenListing>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const address = useAddress()
  const {
    status: { lastKnownHeight },
  } = useRootContext()
  const { dialogRef: txDialogRef, handleShow: showTxDialog } = useDialog()
  const { dialogRef: buyDialogRef, handleShow: showBuyDialog } = useDialog()
  const [operation, setOperation] = useState<Operation | null>(null)
  const [listingHash, setListingHash] = useState<string | null>(null)
  const operations = useMarketplaceOperations()

  function cancelListing(listingHash: string) {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)

    setOperation({ inscription: txInscription })

    showTxDialog()
  }

  function buyListing(listingHash: string) {
    if (!operations) {
      console.warn('No address')
      return
    }

    operations.buy(listingHash, 'cft20').then((txInscription) => {
      setOperation({
        inscription: txInscription,
        feeTitle: 'Token listing price',
      })
      showTxDialog()
    })
  }

  function reserveListing(listingHash: string) {
    setListingHash(listingHash)
    showBuyDialog()
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
    columnHelper.accessor('marketplace_listing.deposit_total', {
      header: 'Minimum Deposit',
      meta: {
        className: 'font-mono',
      },
      cell: (info) =>
        `${round2((info.getValue() / info.row.original.marketplace_listing.total) * 100)}%`,
    }),
    columnHelper.accessor('date_created', {
      header: 'Listed',
      cell: (info) => getDateAgo(info.getValue()),
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
          case ListingState.Reserve:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={() => reserveListing(listingHash)}
              >
                Buy
              </Button>
            )
          case ListingState.Buy:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={() => buyListing(listingHash)}
              >
                Complete order ({blocks})
              </Button>
            )
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
            return `Reserved (${blocks})`
        }
      },
    }),
  ]

  const tableOptions: TableOptions<MarketplaceTokenListing> = {
    columns,
    data: listings,
    state: {},
    getCoreRowModel: getCoreRowModel(),
  }

  if (pages) {
    tableOptions.pageCount = pages
    tableOptions.onPaginationChange = setPagination
    tableOptions.state!.pagination = pagination
    tableOptions.manualPagination = true
  }

  if (serverSorting) {
    tableOptions.onSortingChange = setSorting
    tableOptions.state!.sorting = sorting
    tableOptions.manualSorting = true
  } else {
    tableOptions.getSortedRowModel = getSortedRowModel()
  }

  const table = useReactTable<MarketplaceTokenListing>(tableOptions)

  return (
    <>
      {listings.length < 1 ? (
        <GhostEmptyState text="Be the first to create a listing for this token.">
          <Button
            color="primary"
            className="mt-6"
            onClick={() => onListClick()}
          >
            Sell {token.ticker} tokens
          </Button>
        </GhostEmptyState>
      ) : (
        <Table
          table={table}
          className={className}
          showPagination={pages != null}
        />
      )}

      <TxDialog
        ref={txDialogRef}
        txInscription={operation?.inscription ?? null}
        feeOperationTitle={operation?.feeTitle}
        resultCTA="Back to market"
        resultLink={`/app/market/${token.ticker}`}
      />
      <BuyDialog
        buyType="cft20"
        listingHash={listingHash}
        ref={buyDialogRef}
        resultLink={`/app/market/${token.ticker}`}
      />
    </>
  )
}

function Stats({ token }: { token: Token }) {
  return (
    <div className="flex flex-row gap-8 mt-4">
      <Stat title={`Price`}>
        <AtomValue value={token.last_price_base} horizontal />
      </Stat>
      <Stat title="24H Volume">
        <AtomValue value={token.volume_24_base} horizontal />
      </Stat>
    </div>
  )
}

export default function MarketPage() {
  const data = useLoaderData<typeof loader>()
  const { dialogRef, handleShow } = useDialog()
  const amount = data.token.token_holders?.[0]?.amount
  const { token } = data
  const minted = token.circulating_supply / token.max_supply

  return (
    <div>
      <div className="flex flex-col mb-2">
        <div className="flex flex-row justify-between">
          <BackHeader to="/app/tokens">
            <InscriptionImage
              mime="image/png"
              src={token.content_path!}
              // isExplicit={token.is_explicit} @todo
              className="rounded-xl w-6"
            />
            <span className="ml-2 flex items-baseline">
              Trade {token.name}
              <span className="text-sm font-light text-header-content ml-1">
                {token.ticker}
              </span>
            </span>
          </BackHeader>
          <div>
            {minted < 1 && (
              <Link
                className="btn btn-primary btn-sm mr-2"
                to={`/app/token/${token.ticker}`}
              >
                Mint now
              </Link>
            )}
            <Button color="primary" size="sm" onClick={() => handleShow()}>
              Sell {token.ticker} tokens
            </Button>{' '}
            <SellTokenDialog
              ref={dialogRef}
              ticker={token.ticker}
              tokenAmount={amount ?? 0}
              lastPrice={getDecimalValue(token.last_price_base, token.decimals)}
            />
          </div>
        </div>
        <Stats token={token} />
      </div>
      {data.reservedListings?.length > 0 && (
        <div>
          <h3 className="mt-10 text-lg">Your reserved listing</h3>
          <ListingsTable
            className="mt-2"
            listings={data.reservedListings}
            token={token}
            onListClick={() => handleShow()}
            serverSorting={false}
          />
          <h3 className="mt-16 text-lg">All listings</h3>
        </div>
      )}

      <ListingsTable
        className="mt-2"
        listings={data.listings}
        pages={data.pages}
        token={token}
        onListClick={() => handleShow()}
        serverSorting={true}
      />
    </div>
  )
}
