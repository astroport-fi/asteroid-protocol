import { TxInscription, ValueTypes, order_by } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import AtomValue from '~/components/AtomValue'
import { BackHeader } from '~/components/Back'
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
import {
  AsteroidService,
  CFT20MarketplaceListing,
  Token,
} from '~/services/asteroid'
import { getDateAgo } from '~/utils/date'
import { round1 } from '~/utils/math'
import { getDecimalValue } from '~/utils/number'
import { parsePagination, parseSorting } from '~/utils/pagination'

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

  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const token = await asteroidService.getToken(params.ticker)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  let orderBy: ValueTypes['marketplace_cft20_detail_order_by']
  if (sort === 'marketplace_listing_total') {
    orderBy = {
      marketplace_listing: {
        total: direction,
      },
    }
  } else if (sort === 'marketplace_listing_deposit_total') {
    orderBy = {
      marketplace_listing: {
        deposit_total: direction,
      },
    }
  } else {
    orderBy = {
      [sort]: direction,
    }
  }

  const res = await asteroidService.getTokenListings(
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

enum ListingState {
  Reserve,
  Buy,
  Cancel,
  Reserved,
}

function getListingState(
  listing: CFT20MarketplaceListing,
  walletAddress: string | undefined,
  currentBlock: number,
) {
  const isExpired =
    listing.marketplace_listing.depositor_timedout_block! < currentBlock
  const isDeposited = listing.marketplace_listing.is_deposited

  if (listing.marketplace_listing.seller_address == walletAddress) {
    if (!isDeposited || isExpired) {
      return ListingState.Cancel
    } else {
      return ListingState.Reserved
    }
  } else {
    if (isDeposited && !isExpired) {
      if (listing.marketplace_listing.depositor_address == walletAddress) {
        return ListingState.Buy
      } else {
        return ListingState.Reserved
      }
    }
  }

  return ListingState.Reserve
}

function ListingsTable({
  token,
  listings,
  pages,
  className,
}: {
  token: Token
  listings: CFT20MarketplaceListing[]
  pages: number
  className?: string
}) {
  const columnHelper = createColumnHelper<CFT20MarketplaceListing>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const address = useAddress()
  const {
    status: { lastProcessedHeight },
  } = useRootContext()
  const { dialogRef: txDialogRef, handleShow: showTxDialog } = useDialog()
  const { dialogRef: buyDialogRef, handleShow: showBuyDialog } = useDialog()
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)
  const [listingHash, setListingHash] = useState<string | null>(null)
  const operations = useMarketplaceOperations()

  function cancelListing(listingHash: string) {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)

    setTxInscription(txInscription)

    showTxDialog()
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
        `${round1((info.getValue() / info.row.original.marketplace_listing.total) * 100)}%`,
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
          getListingState(info.row.original, address, lastProcessedHeight)
        ) {
          case ListingState.Reserve:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={() => reserveListing(listingHash)}
              >
                Reserve
              </Button>
            )
          case ListingState.Buy:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={(e) => e.stopPropagation()}
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

  const table = useReactTable<CFT20MarketplaceListing>({
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
      <Table table={table} className={className} />
      <TxDialog
        ref={txDialogRef}
        txInscription={txInscription}
        resultCTA="Back to market"
        resultLink={`/market/${token.ticker}`}
      />
      <BuyDialog
        buyType="cft20"
        listingHash={listingHash}
        ref={buyDialogRef}
        resultLink={`/market/${token.ticker}`}
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

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row justify-between">
          <BackHeader to="/markets">
            <Button color="ghost" className="text-lg font-medium">
              {data.token.ticker} / ATOM Market
            </Button>
          </BackHeader>
          <Button color="primary" size="sm" onClick={() => handleShow()}>
            Sell {data.token.ticker} tokens
          </Button>
          <SellTokenDialog ref={dialogRef} token={data.token} />
        </div>
        <Stats token={data.token} />
      </div>
      <ListingsTable
        className="mt-4"
        listings={data.listings}
        pages={data.pages}
        token={data.token}
      />
    </div>
  )
}
