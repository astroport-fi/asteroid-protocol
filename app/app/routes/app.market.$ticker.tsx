import type { TxInscription } from '@asteroid-protocol/sdk'
import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
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

  return json({
    token,
    listings: res.listings,
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
  className,
  onListClick,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  pages: number
  onListClick: () => void
  className?: string
}) {
  const columnHelper = createColumnHelper<MarketplaceTokenListing>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const address = useAddress()
  const {
    status: { lastProcessedHeight },
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
        const blocks =
          (listing.depositor_timedout_block ?? 0) - lastProcessedHeight
        const listingHash = listing.transaction.hash

        switch (
          getListingState(
            info.row.original.marketplace_listing,
            address,
            lastProcessedHeight,
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
                Buy ({blocks})
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
    pageCount: pages,
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
        <Table table={table} className={className} />
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
  const {
    status: { baseTokenUsd },
  } = useRootContext()

  return (
    <div className="flex flex-row gap-8 mt-4">
      <Stat title="ATOM / USD">
        <NumericFormat prefix="$" displayType="text" value={baseTokenUsd} />
      </Stat>
      <Stat title={`${token.ticker} / ATOM`}>
        <AtomValue value={token.last_price_base} />
      </Stat>
      <Stat title="24H Volume">
        <AtomValue value={token.volume_24_base} />
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
      <div className="flex flex-col">
        <div className="flex flex-row justify-between">
          <BackHeader to="/app/tokens">
            <Button color="ghost" className="text-lg font-medium">
              {token.ticker} / ATOM Market
            </Button>
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
      <ListingsTable
        className="mt-4"
        listings={data.listings}
        pages={data.pages}
        token={token}
        onListClick={() => handleShow()}
      />
    </div>
  )
}
